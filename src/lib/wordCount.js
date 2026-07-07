export function parseWordCount(value) {
  if (!value && value !== 0) return null;
  const str = String(value).trim().replace(/\s/g, '');
  const normalized = str
    .replace(/[.,](?=\d{3}(?:[.,]|$))/g, '')
    .replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? null : Math.round(num);
}
export function formatWordCount(num) {
  if (!num) return '';
  return Number(num).toLocaleString('pt-BR');
}
export function wordsToHours(words) {
  if (!words) return null;
  return (words / 2600 * 0.25).toFixed(1);
}
