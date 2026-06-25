/**
 * Converte string de contagem de palavras para número.
 * Aceita: "17,162" / "17.162" / "17162" / "17 162"
 */
export function parseWordCount(value) {
  if (!value && value !== 0) return null;
  const str = String(value);

  // Remove espaços
  const clean = str.trim().replace(/\s/g, '');

  // Detecta se é formato com vírgula decimal (ex: "1,5") vs separador de milhar
  // Se tem vírgula E ponto, descobre qual é o separador decimal pelo contexto
  // Regra simples: remove todos os pontos e vírgulas usados como milhar
  // Um separador decimal real viria com exatamente 1-2 dígitos depois
  const normalized = clean
    .replace(/[.,](?=\d{3}(?:[.,]|$))/g, '') // remove separador de milhar (3 dígitos após)
    .replace(',', '.'); // troca vírgula decimal por ponto

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
