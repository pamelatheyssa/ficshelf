/**
 * Exporta todas as fanfics para Excel com abas separadas por status.
 * Usa SheetJS (xlsx) via CDN — já disponível no ambiente.
 */
export async function exportToExcel(fanfics, shelves) {
  // Importa SheetJS dinamicamente
  const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs');

  const shelfMap = {};
  shelves.forEach(s => { shelfMap[s.id] = s.name; });

  const statusGroups = {
    'Lidas': fanfics.filter(f => f.status === 'read'),
    'Quero Ler': fanfics.filter(f => f.status === 'want'),
    'Lendo': fanfics.filter(f => f.status === 'reading'),
    'Não Quero Ler': fanfics.filter(f => f.status === 'skip'),
  };

  const wb = XLSX.utils.book_new();

  const toRow = (f) => ({
    'Título': f.title || '',
    'Autor': f.author || '',
    'Plataforma': f.site === 'ao3' ? 'AO3' : f.site === 'wattpad' ? 'Wattpad' : 'Outro',
    'Fandom': f.fandom || '',
    'Ships': (f.ships || []).join(', '),
    'Tags': (f.tags || []).join(', '),
    'Série': f.series || '',
    'Parte': f.seriesPart || '',
    'Capítulos': f.chapters || '',
    'Total Capítulos': f.totalChaptersUnknown ? '?' : (f.totalChapters || ''),
    'Completa': f.complete ? 'Sim' : 'Não',
    'Palavras': f.wordCount || '',
    'Horas estimadas': f.wordCount ? Number((f.wordCount / 2600 * 0.25).toFixed(1)) : '',
    'Nota': f.rating || '',
    'Data Lida': f.readDate || '',
    'Favorita': f.favorite ? 'Sim' : 'Não',
    'Melhor ler no': f.readOn === 'phone' ? 'Celular' : f.readOn === 'kindle' ? 'Kindle' : '',
    'Shelves': (f.shelves || []).map(id => shelfMap[id] || id).join(', '),
    'Mini Resumo': f.miniSummary || '',
    'Resumo/Anotação': f.summary || '',
    'Motivo não querer ler': f.skipReason || '',
    'Link': f.link || '',
  });

  // Aba por status
  for (const [sheetName, list] of Object.entries(statusGroups)) {
    const sorted = [...list].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'pt-BR'));
    const rows = sorted.map(toRow);
    if (rows.length === 0) rows.push(toRow({})); // aba vazia mas com headers
    const ws = XLSX.utils.json_to_sheet(rows);

    // Largura das colunas
    ws['!cols'] = [
      { wch: 40 }, { wch: 25 }, { wch: 10 }, { wch: 20 }, { wch: 30 },
      { wch: 40 }, { wch: 25 }, { wch: 8 }, { wch: 10 }, { wch: 14 },
      { wch: 10 }, { wch: 10 }, { wch: 16 }, { wch: 6 }, { wch: 12 },
      { wch: 8 }, { wch: 14 }, { wch: 25 }, { wch: 35 }, { wch: 50 },
      { wch: 35 }, { wch: 40 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  // Aba resumo geral
  const allRows = fanfics
    .sort((a, b) => (a.title || '').localeCompare(b.title || '', 'pt-BR'))
    .map(f => ({ ...toRow(f), 'Status': { want: 'Quero Ler', reading: 'Lendo', read: 'Lida', skip: 'Não Quero Ler' }[f.status] || f.status }));
  const wsAll = XLSX.utils.json_to_sheet(allRows);
  wsAll['!cols'] = Array(23).fill({ wch: 20 });
  XLSX.utils.book_append_sheet(wb, wsAll, 'Todas');

  // Download
  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `FicShelf_${date}.xlsx`);
}
