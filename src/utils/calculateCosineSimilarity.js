import { charKgrams } from "./preprocessText.js";

export function cosineSimilarity(vec1, vec2) {
  const common = Object.keys(vec1).filter((k) => vec2[k] !== undefined);
  if (common.length === 0) return 0;
 
  const dot   = common.reduce((sum, k) => sum + vec1[k] * vec2[k], 0);
  const norm1 = Math.sqrt(Object.values(vec1).reduce((s, v) => s + v * v, 0));
  const norm2 = Math.sqrt(Object.values(vec2).reduce((s, v) => s + v * v, 0));
 
  return norm1 && norm2 ? dot / (norm1 * norm2) : 0;
}

export function rollingHash(kgram) {
  const base = 31;
  const mod  = 2 ** 32;
  let h = 0;
  for (const ch of kgram) {
    h = (h * base + ch.charCodeAt(0)) % mod;
  }
  return h;
}

export function winnow(text, k = 5, w = 4) {
  const kgrams = charKgrams(text, k);
  if (kgrams.length === 0) return new Set();
 
  const hashes      = kgrams.map(rollingHash);
  const fingerprint = new Set();
  let prevMinPos    = -1;
 
  for (let i = 0; i <= hashes.length - w; i++) {
    const window = hashes.slice(i, i + w);
 
    // Find the minimum value in this window
    const minVal = Math.min(...window);
 
    // Rightmost index of minVal within the window
    const localPos  = window.length - 1 - [...window].reverse().indexOf(minVal);
    const globalPos = i + localPos;
 
    if (globalPos !== prevMinPos) {
      fingerprint.add(minVal);
      prevMinPos = globalPos;
    }
  }
 
  return fingerprint;
}

export function jaccardSimilarity(fp1, fp2) {
  if (fp1.size === 0 || fp2.size === 0) return 0;
 
  let intersectionSize = 0;
  for (const hash of fp1) {
    if (fp2.has(hash)) intersectionSize++;
  }
 
  const unionSize = fp1.size + fp2.size - intersectionSize;
  return intersectionSize / unionSize;
}

export function combinedScore(
  tfidfSim,
  fpSim,
  tfidfWeight = 0.5,
  fpWeight    = 0.5,
) {
  return tfidfWeight * tfidfSim + fpWeight * fpSim;
}

export function verdict(score) {
  if (score >= 0.8) return { label: "HIGH — likely plagiarism",  risk: "HIGH" };
  if (score >= 0.5) return { label: "MEDIUM — possible overlap", risk: "MEDIUM" };
  return { label: "LOW — likely original", risk: "LOW" };
}