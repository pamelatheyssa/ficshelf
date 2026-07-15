/**
 * Importa dados do AO3 via proxy Vercel.
 * O proxy tenta primeiro a API JSON oficial, depois HTML scraping.
 */
export async function importFromAO3(url) {
  const match = url.match(/archiveofourown\.org\/works\/(\d+)/);
  if (!match) {
    throw new Error('Link do AO3 não reconhecido. Use: archiveofourown.org/works/NÚMERO');
  }

  const workId = match[1];

  let proxyData;
  try {
    const res = await fetch(`/api/ao3proxy?workId=${workId}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Erro ${res.status} ao acessar o AO3.`);
    }
    proxyData = await res.json();
  } catch (e) {
    throw new Error(e.message || 'Falha ao conectar ao proxy.');
  }

  // Fonte 1: API JSON oficial do AO3
  if (proxyData.source === 'api' && proxyData.data) {
    return parseFromAPI(proxyData.data);
  }

  // Fonte 2: HTML scraping
  if (proxyData.source === 'html' && proxyData.html) {
    return parseFromHTML(proxyData.html);
  }

  throw new Error('Resposta inesperada do servidor. Tente novamente.');
}

// ── Parseia a resposta da API JSON do AO3 ──
function parseFromAPI(data) {
  const title = data.title || '';

  // Autores: podem estar em data.authors[] ou data.pseuds[]
  let author = '';
  if (data.authors?.length) {
    author = data.authors.map(a => a.name || a.login || a.pseudonym || String(a)).filter(Boolean).join(', ');
  } else if (data.pseuds?.length) {
    author = data.pseuds.map(p => p.name || String(p)).join(', ');
  } else if (data.author_byline) {
    author = data.author_byline.replace(/^by\s*/i, '').trim();
  }

  const fandom = (data.fandoms || data.fandom_strings || []).join(', ');
  const ships = data.relationships || data.relationship_strings || [];
  const freeTags = data.freeform_tags || data.freeform_strings || data.tags || [];
  const warnings = (data.warnings || data.warning_strings || [])
    .filter(w => w !== 'No Archive Warnings Apply' && w !== 'Creator Chose Not To Use Archive Warnings');
  const tags = [...warnings, ...freeTags].slice(0, 15);

  const wordCount = data.stats?.words || data.word_count || null;

  const chapWritten = data.stats?.chapters_written ?? data.chapters_written ?? null;
  const chapExpected = data.stats?.chapters_expected ?? data.chapters_expected ?? null;
  const totalChaptersUnknown = chapExpected === null || chapExpected === '?';
  const complete = data.complete ?? data.completed ?? false;

  if (!title) throw new Error('Não foi possível ler os dados da obra via API.');

  return {
    title, author, fandom, ships, tags,
    chapters: chapWritten != null ? String(chapWritten) : '',
    totalChapters: !totalChaptersUnknown && chapExpected != null ? String(chapExpected) : '',
    totalChaptersUnknown,
    wordCount: wordCount ? Number(wordCount) : null,
    complete,
    site: 'ao3',
  };
}

// ── Parseia o HTML da página do AO3 ──
function parseFromHTML(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  if (doc.querySelector('form#new_user') || (doc.title || '').includes('Log In')) {
    throw new Error('Esta obra requer login no AO3 para ser acessada.');
  }

  const title =
    doc.querySelector('h2.title.heading')?.textContent?.trim() ||
    doc.querySelector('.title.heading')?.textContent?.trim() ||
    doc.querySelector('h2.title')?.textContent?.trim() || '';

  // Autor — múltiplas estratégias
  let author = '';
  const authorLinks = doc.querySelectorAll('a[rel="author"]');
  if (authorLinks.length > 0) {
    author = [...authorLinks].map(a => a.textContent.trim()).join(', ');
  }
  if (!author) {
    const byline = doc.querySelector('h3.byline.heading') || doc.querySelector('.byline.heading') || doc.querySelector('dd.byline');
    if (byline) {
      const links = byline.querySelectorAll('a');
      author = links.length > 0
        ? [...links].map(a => a.textContent.trim()).join(', ')
        : byline.textContent.trim().replace(/^by\s*/i, '').trim();
    }
  }
  if (!author) {
    const userLink = doc.querySelector('a[href*="/users/"]');
    if (userLink) author = userLink.textContent.trim();
  }

  const fandoms = [...doc.querySelectorAll('.fandom.tags a, dd.fandom a')]
    .map(a => a.textContent.trim()).filter(Boolean);
  const fandom = fandoms.join(', ');

  const ships = [...doc.querySelectorAll('.relationship.tags a, dd.relationship a')]
    .map(a => a.textContent.trim()).filter(Boolean);

  const freeTags = [...doc.querySelectorAll('.freeform.tags a, dd.freeform a')]
    .map(a => a.textContent.trim()).filter(Boolean).slice(0, 12);

  const warnings = [...doc.querySelectorAll('.warning.tags a, dd.warning a')]
    .map(a => a.textContent.trim())
    .filter(w => w && w !== 'No Archive Warnings Apply' && w !== 'Creator Chose Not To Use Archive Warnings');

  const tags = [...warnings, ...freeTags].slice(0, 15);

  const wordsText = doc.querySelector('dd.words')?.textContent?.replace(/[^\d]/g, '') || '';
  const wordCount = wordsText ? parseInt(wordsText, 10) : null;

  const chapText = doc.querySelector('dd.chapters')?.textContent?.trim() || '';
  let chapters = null, totalChapters = null, totalChaptersUnknown = false;
  if (chapText) {
    const parts = chapText.split('/');
    chapters = parseInt(parts[0], 10) || null;
    if (!parts[1] || parts[1].trim() === '?') totalChaptersUnknown = true;
    else totalChapters = parseInt(parts[1], 10) || null;
  }

  const statusEl = doc.querySelector('dd.status');
  const complete = statusEl?.textContent?.trim() === 'Completed' ||
    (!totalChaptersUnknown && chapters !== null && totalChapters !== null && chapters >= totalChapters);

  if (!title) {
    throw new Error('Não foi possível ler os dados. A obra pode ser restrita a membros do AO3.');
  }

  return {
    title, author, fandom, ships, tags,
    chapters: chapters ? String(chapters) : '',
    totalChapters: totalChapters ? String(totalChapters) : '',
    totalChaptersUnknown, wordCount, complete, site: 'ao3',
  };
}
