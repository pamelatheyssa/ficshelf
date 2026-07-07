// Categoriza fic pelo total de capítulos
export function getFicCategory(fanfic) {
  const total = Number(fanfic.totalChapters) || 0;
  if (total === 0) return null;
  if (total <= 5) return { label: 'Curta', color: '#10B981' };
  if (total <= 15) return { label: 'Média', color: '#60A5FA' };
  if (total <= 30) return { label: 'Longa', color: '#A78BFA' };
  if (total <= 70) return { label: 'Super longa', color: '#F472B6' };
  return { label: 'Hiper longa', color: '#F59E0B' };
}

// Busca aproximada: cada palavra do query precisa aparecer no texto
export function fuzzyMatch(text, query) {
  if (!query || !text) return false;
  const words = query.toLowerCase().trim().split(/\s+/);
  const t = text.toLowerCase();
  return words.every(w => t.includes(w));
}
