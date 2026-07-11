export async function importFromAO3(url) {
  const match = url.match(/archiveofourown\.org\/works\/(\d+)/);
  if (!match) {
    throw new Error('Link do AO3 não reconhecido. Use o formato: archiveofourown.org/works/NÚMERO');
  }

  const workId = match[1];
  const proxyUrl = `/api/ao3proxy?workId=${workId}`;

  let html;
  try {
    const res = await fetch(proxyUrl);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Erro ${res.status}`);
    }
    html = await res.text();
  } catch (e) {
    throw new Error(e.message || 'Não foi possível acessar o AO3.');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  if (doc.querySelector('form#new_user') || (doc.title || '').includes('Log In')) {
    throw new Error('Esta obra requer login no AO3 para ser acessada.');
  }

  // ── TÍTULO ──
  const title =
    doc.querySelector('h2.title.heading')?.textContent?.trim() ||
    doc.querySelector('.title.heading')?.textContent?.trim() ||
    doc.querySelector('h2.title')?.textContent?.trim() || '';

  // ── AUTOR ── O AO3 tem várias estruturas possíveis:
  // 1) <a rel="author">Nome</a>  — caso mais comum
  // 2) .byline.heading a  — quando há pseudônimo
  // 3) dd.byline a        — variante alternativa
  // 4) Texto do byline sem link (obras órfãs)
  let author = '';

  const authorLinks = doc.querySelectorAll('a[rel="author"]');
  if (authorLinks.length > 0) {
    author = [...authorLinks].map(a => a.textContent.trim()).join(', ');
  }

  if (!author) {
    const bylineEl =
      doc.querySelector('h3.byline.heading') ||
      doc.querySelector('.byline.heading') ||
      doc.querySelector('dd.byline');
    if (bylineEl) {
      const links = bylineEl.querySelectorAll('a');
      if (links.length > 0) {
        author = [...links].map(a => a.textContent.trim()).join(', ');
      } else {
        // Obra anônima ou órfã — pega o texto puro
        author = bylineEl.textContent.trim().replace(/^by\s*/i, '').trim();
      }
    }
  }

  // Fallback: procura no meta ou qualquer link com /users/ no href
  if (!author) {
    const userLink = doc.querySelector('a[href*="/users/"]');
    if (userLink) author = userLink.textContent.trim();
  }

  // ── FANDOM ──
  const fandoms = [...doc.querySelectorAll('.fandom.tags a, dd.fandom a')]
    .map(a => a.textContent.trim()).filter(Boolean);
  const fandom = fandoms.join(', ');

  // ── SHIPS ──
  const ships = [...doc.querySelectorAll('.relationship.tags a, dd.relationship a')]
    .map(a => a.textContent.trim()).filter(Boolean);

  // ── TAGS ──
  const freeTags = [...doc.querySelectorAll('.freeform.tags a, dd.freeform a')]
    .map(a => a.textContent.trim()).filter(Boolean).slice(0, 12);

  const warnings = [...doc.querySelectorAll('.warning.tags a, dd.warning a')]
    .map(a => a.textContent.trim())
    .filter(w => w && w !== 'No Archive Warnings Apply' && w !== 'Creator Chose Not To Use Archive Warnings');

  const tags = [...warnings, ...freeTags].slice(0, 15);

  // ── PALAVRAS ──
  const wordsText = doc.querySelector('dd.words')?.textContent?.replace(/[^\d]/g, '') || '';
  const wordCount = wordsText ? parseInt(wordsText, 10) : null;

  // ── CAPÍTULOS ──
  const chapText = doc.querySelector('dd.chapters')?.textContent?.trim() || '';
  let chapters = null, totalChapters = null, totalChaptersUnknown = false;
  if (chapText) {
    const parts = chapText.split('/');
    chapters = parseInt(parts[0], 10) || null;
    if (!parts[1] || parts[1].trim() === '?') {
      totalChaptersUnknown = true;
    } else {
      totalChapters = parseInt(parts[1], 10) || null;
    }
  }

  // ── COMPLETA ──
  const statusEl = doc.querySelector('dd.status');
  const complete =
    statusEl?.textContent?.trim() === 'Completed' ||
    (!totalChaptersUnknown && chapters !== null && totalChapters !== null && chapters >= totalChapters);

  if (!title) {
    throw new Error(
      'Não foi possível ler os dados da obra. ' +
      'Ela pode ser restrita a membros do AO3, ou o link pode estar incorreto.'
    );
  }

  return { title, author, fandom, ships, tags, chapters: chapters ? String(chapters) : '',
    totalChapters: totalChapters ? String(totalChapters) : '', totalChaptersUnknown,
    wordCount, complete, site: 'ao3' };
}
