export function getFicCategory(fanfic) {
  const words = Number(fanfic.wordCount) || 0;
  if (words === 0) return null;
  if (words <= 5000)   return { label: 'Curtíssima',   color: '#4A9A6A' };
  if (words <= 10000)  return { label: 'Curtinha',      color: '#5B8FAA' };
  if (words <= 20000)  return { label: 'Curta',         color: '#6A7AAA' };
  if (words <= 40000)  return { label: 'Média',         color: '#8A6AAA' };
  if (words <= 60000)  return { label: 'Mais da média', color: '#AA6A8A' };
  if (words <= 100000) return { label: 'Grande',        color: '#C07850' };
  if (words <= 150000) return { label: 'Longa',         color: '#C05858' };
  return                      { label: 'Super longa',   color: '#8B3A8B' };
}

export function fuzzyMatch(text, query) {
  if (!query || !text) return false;
  const words = query.toLowerCase().trim().split(/\s+/);
  const t = text.toLowerCase();
  return words.every(w => t.includes(w));
}
