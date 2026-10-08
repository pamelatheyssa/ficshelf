export function getAutoPreferPhone(wordCount) {
  const w = Number(wordCount) || 0;
  if (w === 0) return null;
  return w <= 20000;
}
