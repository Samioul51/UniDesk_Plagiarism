export const STOP_WORDS = new Set([
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "was", "are", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will", "would",
    "could", "should", "may", "might", "this", "that", "these", "those",
    "it", "its", "i", "we", "you", "he", "she", "they", "not", "so", "as",
    "if", "then", "than", "also", "just", "e", "g",
]);

export function preprocessText(text) {
    const lower   = text.toLowerCase();
    const cleaned = lower.replace(/[^a-z0-9\s]/g, "");
    return cleaned
        .split(/\s+/)
        .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

export function makeNgrams(tokens, n) {
    const ngrams = [];
    for (let i = 0; i <= tokens.length - n; i++) {
        ngrams.push(tokens.slice(i, i + n).join("_"));
    }
    return ngrams;
}

export function buildTokens(tokens, range = [1, 3]) {
  const [minN, maxN] = range;
  const combined = [];
  for (let n = minN; n <= maxN; n++) {
    combined.push(...makeNgrams(tokens, n));
  }
  return combined;
}

export function charKgrams(text, k = 5) {
  const normalised = text.toLowerCase().replace(/\s+/g, " ").trim();
  const kgrams = [];
  for (let i = 0; i <= normalised.length - k; i++) {
    kgrams.push(normalised.slice(i, i + k));
  }
  return kgrams;
}