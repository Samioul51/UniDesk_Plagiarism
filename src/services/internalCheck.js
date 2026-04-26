import { extractText } from "./extractText.js";
import { chunkText } from "./chunkText.js";
import { preprocessText as preprocess, buildTokens } from "../utils/preprocessText.js";
import { computeTF, computeIDF, computeTFIDF, topSharedTerms } from "../utils/computeTfIdf.js";
import {
  cosineSimilarity,
  winnow,
  jaccardSimilarity,
  combinedScore,
  verdict,
} from "../utils/calculateCosineSimilarity.js";

// Configuration
const MAX_FILES = 5;
const NGRAM_RANGE = [1, 3];
const WINNOW_K = 5;
const WINNOW_W = 4;
const TFIDF_WEIGHT = 0.5;
const FP_WEIGHT = 0.5;
const DEFAULT_THRESHOLD = 0.1;

//  Helpers

function buildVector(rawText, idf) {
  const tokens = preprocess(rawText);
  const allTokens = buildTokens(tokens, NGRAM_RANGE);
  const tf = computeTF(allTokens);
  return computeTFIDF(tf, idf);
}

// Computing a shared IDF table across all documents

function buildCorpusIDF(rawTexts) {
  const tokenizedDocs = rawTexts.map((t) =>
    buildTokens(preprocess(t), NGRAM_RANGE)
  );
  return computeIDF(tokenizedDocs);
}

// Summarizing chunklevel overlap between two documents

function analyseChunkOverlap(chunksA, chunksB) {
  if (!chunksA.length || !chunksB.length) {
    return { avgChunkSimilarity: 0, maxChunkSimilarity: 0, hotspots: [] };
  }

  const allChunkTokens = [...chunksA, ...chunksB].map((c) =>
    buildTokens(preprocess(c), [1, 2])
  );
  const chunkIDF = computeIDF(allChunkTokens);

  const buildChunkVec = (chunk) => {
    const tokens = buildTokens(preprocess(chunk), [1, 2]);
    return computeTFIDF(computeTF(tokens), chunkIDF);
  };

  const vecsA = chunksA.map(buildChunkVec);
  const vecsB = chunksB.map(buildChunkVec);

  let totalBest = 0;
  let maxScore = 0;
  const hotspots = [];

  for (let i = 0; i < vecsA.length; i++) {
    let bestScore = 0;
    let bestJ = 0;

    for (let j = 0; j < vecsB.length; j++) {
      const score = cosineSimilarity(vecsA[i], vecsB[j]);
      if (score > bestScore) { bestScore = score; bestJ = j; }
    }

    totalBest += bestScore;
    if (bestScore > maxScore) maxScore = bestScore;

    if (bestScore >= 0.5) {
      hotspots.push({ chunkA: i, chunkB: bestJ, score: +bestScore.toFixed(4) });
    }
  }

  return {
    avgChunkSimilarity: +(totalBest / vecsA.length).toFixed(4),
    maxChunkSimilarity: +maxScore.toFixed(4),
    hotspots: hotspots.sort((a, b) => b.score - a.score).slice(0, 5),
  };
}

//  Main function

export async function internalCheck(files, opts = {}) {
  const { threshold = DEFAULT_THRESHOLD } = opts;

  if (!files || files.length === 0) {
    throw new Error("No files provided for internal check.");
  }

  const accepted = files.slice(0, MAX_FILES);
  const skipped = files.slice(MAX_FILES).map((f) => f.originalname);

  const docs = [];
  const errors = [];

  await Promise.all(
    accepted.map(async (file) => {
      try {
        const rawText = await extractText(file);
        const chunks = chunkText(rawText);
        docs.push({ name: file.originalname, rawText, chunks });
      } catch (err) {
        errors.push(file.originalname);
        console.error(`[internalCheck] Failed to extract "${file.originalname}": ${err.message}`);
      }
    })
  );

  if (docs.length < 2) {
    return {
      totalFiles: docs.length,
      totalPairs: 0,
      pairs: [],
      summary: { flagged: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0 },
      skipped,
      errors,
      message: "At least 2 readable documents are required for comparison.",
    };
  }

  const idf = buildCorpusIDF(docs.map((d) => d.rawText));
  const vectors = docs.map((d) => buildVector(d.rawText, idf));
  const fingerprints = docs.map((d) => winnow(d.rawText, WINNOW_K, WINNOW_W));

  // Pairwise comparison

  const pairs = [];
  const n = docs.length;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const tfidfSim = cosineSimilarity(vectors[i], vectors[j]);
      const fpSim = jaccardSimilarity(fingerprints[i], fingerprints[j]);
      const score = combinedScore(tfidfSim, fpSim, TFIDF_WEIGHT, FP_WEIGHT);

      if (score <= threshold) continue;

      const { phrases, words } = topSharedTerms(vectors[i], vectors[j]);
      const intersection = [...fingerprints[i]].filter((h) => fingerprints[j].has(h));
      const unionSize = fingerprints[i].size + fingerprints[j].size - intersection.length;
      const chunkAnalysis = analyseChunkOverlap(docs[i].chunks, docs[j].chunks);

      pairs.push({
        docA: docs[i].name,
        docB: docs[j].name,
        tfidfScore: +tfidfSim.toFixed(4),
        fpScore: +fpSim.toFixed(4),
        combined: +score.toFixed(4),
        verdict: verdict(score),
        topPhrases: phrases.map((p) => p.replace(/_/g, " ")),
        topWords: words,
        sharedHashes: intersection.length,
        totalHashes: unionSize,
        avgChunkSimilarity: chunkAnalysis.avgChunkSimilarity,
        maxChunkSimilarity: chunkAnalysis.maxChunkSimilarity,
        hotspots: chunkAnalysis.hotspots,
      });
    }
  }

  // Sort highest risk first

  pairs.sort((a, b) => b.combined - a.combined);

  const summary = {
    flagged: pairs.length,
    highRisk: pairs.filter((p) => p.verdict.risk === "HIGH").length,
    mediumRisk: pairs.filter((p) => p.verdict.risk === "MEDIUM").length,
    lowRisk: pairs.filter((p) => p.verdict.risk === "LOW").length,
  };

  return {
    totalFiles: docs.length,
    totalPairs: (n * (n - 1)) / 2,
    pairs,
    summary,
    skipped,
    errors,
  };
}