export function computeTF(tokens) {
  if (tokens.length === 0) return {};
 
  // @type {Object.<string, number>}
  const counts = {};
  for (const token of tokens) {
    counts[token] = (counts[token] ?? 0) + 1;
  }
 
  const total = tokens.length;
  // @type {Object.<string, number>}
  const tf = {};
  for (const [word, count] of Object.entries(counts)) {
    tf[word] = count / total;
  }
  return tf;
}

export function computeIDF(tokenizedDocs) {
  const N = tokenizedDocs.length;
 
  // @type {Object.<string, number>} document-frequency counter
  const df = {};
  for (const doc of tokenizedDocs) {
    // Count each unique term once per document
    for (const term of new Set(doc)) {
      df[term] = (df[term] ?? 0) + 1;
    }
  }
 
  // @type {Object.<string, number>}
  const idf = {};
  for (const [term, freq] of Object.entries(df)) {
    idf[term] = Math.log((1 + N) / (1 + freq)) + 1;
  }
  return idf;
}

export function computeTFIDF(tf, idf) {
  // @type {Object.<string, number>}
  const tfidf = {};
  for (const [term, tfWeight] of Object.entries(tf)) {
    if (idf[term] !== undefined) {
      tfidf[term] = tfWeight * idf[term];
    }
  }
  return tfidf;
}

export function topSharedTerms(vec1, vec2, n = 5) {
  // @type {Object.<string, number>}
  const shared = {};
  for (const term of Object.keys(vec1)) {
    if (vec2[term] !== undefined) {
      shared[term] = vec1[term] * vec2[term];
    }
  }
 
  const ranked = Object.entries(shared)
    .sort(([, a], [, b]) => b - a)
    .map(([term]) => term);
 
  const phrases = ranked.filter((t) => t.includes("_")).slice(0, n);
  const words   = ranked.filter((t) => !t.includes("_")).slice(0, n);
 
  return { phrases, words };
}