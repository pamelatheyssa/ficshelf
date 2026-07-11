/**
 * Importa dados de uma obra do AO3.
 * Usa /api/ao3proxy (Vercel Serverless Function) para evitar CORS.
 */
export async function importFromAO3(url) {
  const match = url.match(/archiveofourown\.org\/works\/(\d+)/);
  if (!match) {
    throw new Error('Link do AO3 não reconhecido. Use o formato: archiveofourown.org/works/NÚMERO');
  }

  const workId = match[1];

  // Usa nosso próprio proxy serverless no Vercel
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
    if (e.message.includes('Failed to fetch') || e.message.includes('NetworkError')) {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    }
    throw new Error(e.message || 'Não foi possível acessar o AO3.');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Verifica se foi redirecionado para login ou página de erro
  if (doc.querySelector('form#new_user') || doc.title?.includes('Log In')) {
    throw new Error('Esta obra requer login no AO3 para ser acessada.');
  }

  // Título
  const title =
    doc.querySelector('h2.title.heading')?.textContent?.trim() ||
    doc.querySelector('.title.heading')?.textContent?.trim() ||
    doc.querySelector('h2.title')?.textContent?.trim() || '';

  // Autor
  const author =
    doc.querySelector('a[rel="author"]')?.textContent?.trim() ||
    doc.querySelector('.byline.heading a')?.textContent?.trim() ||
    doc.querySelector('.byline a')?.textContent?.trim() || '';

  // Fandom
  const fandoms = [...doc.querySelectorAll('.fandom.tags a, dd.fandom a')]
    .map(a => a.textContent.trim()).filter(Boolean);
  const fandom = fandoms.join(', ');

  // Ships / relationships
  const ships = [...doc.querySelectorAll('.relationship.tags a, dd.relationship a')]
    .map(a => a.textContent.trim()).filter(Boolean);

  // Tags livres
  const freeTags = [...doc.querySelectorAll('.freeform.tags a, dd.freeform a')]
    .map(a => a.textContent.trim()).filter(Boolean).slice(0, 12);

  // Warnings
  const warnings = [...doc.querySelectorAll('.warning.tags a, dd.warning a')]
    .map(a => a.textContent.trim())
    .filter(w => w && w !== 'No Archive Warnings Apply' && w !== 'Creator Chose Not To Use Archive Warnings');

  const tags = [...warnings, ...freeTags].slice(0, 15);

  // Palavras
  const wordsText = doc.querySelector('dd.words')?.textContent?.replace(/[^\d]/g, '') || '';
  const wordCount = wordsText ? parseInt(wordsText, 10) : null;

  // Capítulos: "X/Y" ou "X/?"
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

  // Completa
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

  return {
    title,
    author,
    fandom,
    ships,
    tags,
    chapters: chapters ? String(chapters) : '',
    totalChapters: totalChapters ? String(totalChapters) : '',
    totalChaptersUnknown,
    wordCount,
    complete,
    site: 'ao3',
  };
}
