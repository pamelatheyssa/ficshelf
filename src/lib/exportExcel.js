export async function exportToExcel(fanfics, shelves) {
  const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs');

  const statusGroups = {
    'Lidas': fanfics.filter(f => f.status === 'read'),
    'Quero Ler': fanfics.filter(f => f.status === 'want'),
    'Lendo': fanfics.filter(f => f.status === 'reading'),
    'Não Quero Ler': fanfics.filter(f => f.status === 'skip'),
  };

  const wb = XLSX.utils.book_new();

  // Aba simples: nome, autor, link
  const toSimpleRow = (f) => ({
    'Nome da Fanfic': f.title || '',
    'Autor': f.author || '',
    'Link': f.link || '',
  });

  // Aba completa com todos os detalhes
  const shelfMap = {};
  shelves.forEach(s => { shelfMap[s.id] = s.name; });

  const toFullRow = (f) => ({
    'Nome da Fanfic': f.title || '',
    'Autor': f.author || '',
    'Link': f.link || '',
    'Plataforma': f.site === 'ao3' ? 'AO3' : f.site === 'wattpad' ? 'Wattpad' : 'Outro',
    'Capítulos lidos': f.chapters || '',
    'Total capítulos': f.totalChaptersUnknown ? '?' : (f.totalChapters || ''),
    'Completa': f.complete ? 'Sim' : 'Não',
    'Palavras': f.wordCount || '',
    'Horas estimadas': f.wordCount ? Number((f.wordCount / 2600 * 0.25).toFixed(1)) : '',
    'Nota': f.rating || '',
    'Data lida': f.readDate || '',
    'Favorita': f.favorite ? 'Sim' : 'Não',
    'Melhor ler no': f.readOn === 'phone' ? 'Celular' : f.readOn === 'kindle' ? 'Kindle' : '',
    'Shelves': (f.shelves || []).map(id => shelfMap[id] || id).join(', '),
    'Mini Resumo': f.miniSummary || '',
    'Resumo/Anotação': f.summary || '',
    'Motivo não querer ler': f.skipReason || '',
  });

  const sortByTitle = (list) => [...list].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'pt-BR'));

  // Aba por status — versão simples
  for (const [sheetName, list] of Object.entries(statusGroups)) {
    const rows = sortByTitle(list).map(toSimpleRow);
    if (rows.length === 0) rows.push({ 'Nome da Fanfic': '', 'Autor': '', 'Link': '' });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 50 }, { wch: 30 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  // Aba completa com todos os detalhes
  const allRows = sortByTitle(fanfics).map(f => ({
    'Status': { want: 'Quero Ler', reading: 'Lendo', read: 'Lida', skip: 'Não Quero Ler' }[f.status] || '',
    ...toFullRow(f),
  }));
  const wsAll = XLSX.utils.json_to_sheet(allRows);
  wsAll['!cols'] = [
    { wch: 12 }, { wch: 50 }, { wch: 30 }, { wch: 60 },
    { wch: 10 }, { wch: 12 }, { wch: 16 }, { wch: 10 },
    { wch: 10 }, { wch: 16 }, { wch: 6 }, { wch: 12 },
    { wch: 8 }, { wch: 14 }, { wch: 25 }, { wch: 40 }, { wch: 40 }, { wch: 35 },
  ];
  XLSX.utils.book_append_sheet(wb, wsAll, 'Completo');

  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `FicShelf_${date}.xlsx`);
}
