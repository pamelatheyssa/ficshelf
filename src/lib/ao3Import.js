/**
 * Importa dados de uma obra do AO3 via proxy CORS (allorigins.win).
 * Parseia o HTML da página da obra.
 */
export async function importFromAO3(url) {
  const match = url.match(/archiveofourown\.org\/works\/(\d+)/);
  if (!match) throw new Error('Link do AO3 não reconhecido. Use: archiveofourown.org/works/NÚMERO');

  const workId = match[1];
  const targetUrl = `https://archiveofourown.org/works/${workId}?view_adult=true`;
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;

  let html;
  try {
    const res = await fetch(proxyUrl, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`Proxy retornou ${res.status}`);
    const json = await res.json();
    if (!json.contents) throw new Error('Resposta vazia do proxy');
    html = json.contents;
  } catch (e) {
    // Tenta proxy alternativo
    try {
      const alt = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
      const res2 = await fetch(alt);
      if (!res2.ok) throw new Error('Ambos os proxies falharam');
      html = await res2.text();
    } catch {
      throw new Error('Não foi possível acessar o AO3. Verifique sua conexão e tente novamente.');
    }
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

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

  // Ships
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

  // Stats
  const wordsText = doc.querySelector('dd.words')?.textContent?.replace(/[^\d]/g, '') || '';
  const wordCount = wordsText ? parseInt(wordsText, 10) : null;

  // Capítulos: formato "X/Y" ou "X/?"
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

  // Status da obra
  const statusEl = doc.querySelector('dd.status');
  const complete =
    statusEl?.textContent?.trim() === 'Completed' ||
    (!totalChaptersUnknown && chapters !== null && totalChapters !== null && chapters >= totalChapters);

  if (!title) {
    throw new Error(
      'Não foi possível ler os dados. A obra pode ser só para membros do AO3, ' +
      'ou o link pode estar incorreto.'
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
