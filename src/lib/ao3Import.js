/**
 * Importa dados de uma obra do AO3 parseando o HTML da página.
 * Usa allorigins.win como proxy CORS para contornar bloqueio do navegador.
 */
export async function importFromAO3(url) {
  const match = url.match(/archiveofourown\.org\/works\/(\d+)/);
  if (!match) throw new Error('Link do AO3 não reconhecido. Use o formato: archiveofourown.org/works/NÚMERO');

  const workId = match[1];

  // allorigins retorna o HTML da página como JSON
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
    `https://archiveofourown.org/works/${workId}?view_adult=true&view_full_work=false`
  )}`;

  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error('Não foi possível acessar o AO3. Tente novamente.');

  const json = await res.json();
  if (!json.contents) throw new Error('Resposta inválida do proxy. Tente novamente.');

  const html = json.contents;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Título
  const title = doc.querySelector('h2.title')?.textContent?.trim()
    || doc.querySelector('.title.heading')?.textContent?.trim()
    || '';

  // Autor
  const authorEl = doc.querySelector('a[rel="author"]') || doc.querySelector('.byline a');
  const author = authorEl?.textContent?.trim() || '';

  // Fandom
  const fandoms = [...doc.querySelectorAll('.fandom.tags a')]
    .map(a => a.textContent.trim()).filter(Boolean);
  const fandom = fandoms.join(', ');

  // Ships / relationships
  const ships = [...doc.querySelectorAll('.relationship.tags a')]
    .map(a => a.textContent.trim()).filter(Boolean);

  // Tags livres
  const tags = [...doc.querySelectorAll('.freeform.tags a')]
    .map(a => a.textContent.trim()).filter(Boolean).slice(0, 12);

  // Stats
  const wordsEl = doc.querySelector('dd.words');
  const wordCount = wordsEl
    ? parseInt(wordsEl.textContent.replace(/[^\d]/g, ''), 10) || null
    : null;

  const chaptersEl = doc.querySelector('dd.chapters');
  let chapters = null, totalChapters = null, totalChaptersUnknown = false;
  if (chaptersEl) {
    const parts = chaptersEl.textContent.trim().split('/');
    chapters = parseInt(parts[0], 10) || null;
    if (parts[1] === '?' || parts[1] === undefined) {
      totalChaptersUnknown = true;
    } else {
      totalChapters = parseInt(parts[1], 10) || null;
    }
  }

  // Completa
  const statusEl = doc.querySelector('dd.status');
  const complete = statusEl?.textContent?.trim() === 'Completed'
    || doc.querySelector('dt.status')?.textContent?.includes('Completed')
    || (!totalChaptersUnknown && chapters !== null && totalChapters !== null && chapters >= totalChapters);

  // Warnings
  const warnings = [...doc.querySelectorAll('.warning.tags a')]
    .map(a => a.textContent.trim())
    .filter(w => w && w !== 'No Archive Warnings Apply');

  if (!title) throw new Error('Não foi possível ler os dados. O AO3 pode estar com acesso restrito ou a obra pode ser só para membros.');

  return {
    title,
    author,
    fandom,
    ships,
    tags: [...warnings, ...tags].slice(0, 15),
    chapters: chapters ? String(chapters) : '',
    totalChapters: totalChapters ? String(totalChapters) : '',
    totalChaptersUnknown,
    wordCount,
    complete,
    site: 'ao3',
  };
}
