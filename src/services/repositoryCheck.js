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

const NGRAM_RANGE = [1, 3];
const WINNOW_K = 5;
const WINNOW_W = 4;
const TFIDF_WEIGHT = 0.5;
const FP_WEIGHT = 0.5;
const DEFAULT_THRESHOLD = 0.1;

async function fetchAllDocuments(sql) {
  return sql`
    SELECT id, file_name, full_text
    FROM   documents
    ORDER  BY created_at DESC
  `;
}

async function fetchChunksForDocument(sql, documentId) {
  return sql`
    SELECT chunk_index, chunk_text
    FROM   document_chunks
    WHERE  document_id = ${documentId}
    ORDER  BY chunk_index ASC
  `;
}

//  Helper functios

function buildVector(rawText, idf) {
  const tokens = preprocess(rawText);
  const allTokens = buildTokens(tokens, NGRAM_RANGE);
  const tf = computeTF(allTokens);
  return computeTFIDF(tf, idf);
}

function buildCorpusIDF(rawTexts) {
  const tokenizedDocs = rawTexts.map((t) =>
    buildTokens(preprocess(t), NGRAM_RANGE)
  );
  return computeIDF(tokenizedDocs);
}

function analyseChunkOverlap(uploadedChunks, repoChunks, topK = 5) {
  if (!uploadedChunks.length || !repoChunks.length) {
    return { avgChunkSimilarity: 0, maxChunkSimilarity: 0, hotspots: [] };
  }

  const allChunks = [...uploadedChunks, ...repoChunks];
  const allTokenized = allChunks.map((c) =>
    buildTokens(preprocess(c), [1, 2])
  );
  const chunkIDF = computeIDF(allTokenized);

  const buildChunkVec = (chunk) => {
    const tokens = buildTokens(preprocess(chunk), [1, 2]);
    return computeTFIDF(computeTF(tokens), chunkIDF);
  };

  const uploadedVecs = uploadedChunks.map(buildChunkVec);
  const repoVecs = repoChunks.map(buildChunkVec);

  let totalBest = 0;
  let maxScore = 0;
  const hotspots = [];

  for (let i = 0; i < uploadedVecs.length; i++) {
    let bestScore = 0;
    let bestJ = 0;

    for (let j = 0; j < repoVecs.length; j++) {
      const score = cosineSimilarity(uploadedVecs[i], repoVecs[j]);
      if (score > bestScore) { bestScore = score; bestJ = j; }
    }

    totalBest += bestScore;
    if (bestScore > maxScore) maxScore = bestScore;

    if (bestScore >= 0.5) {
      hotspots.push({ uploadedChunk: i, repoChunk: bestJ, score: +bestScore.toFixed(4) });
    }
  }

  return {
    avgChunkSimilarity: +(totalBest / uploadedVecs.length).toFixed(4),
    maxChunkSimilarity: +maxScore.toFixed(4),
    hotspots: hotspots.sort((a, b) => b.score - a.score).slice(0, topK),
  };
}

// Main function

export async function repositoryCheck(files, sql, opts = {}) {
  const { threshold = DEFAULT_THRESHOLD } = opts;

  if (!files || files.length === 0) {
    throw new Error("No files provided for repository check.");
  }

  const uploadedDocs = [];
  const errors = [];

  await Promise.all(
    files.map(async (file) => {
      try {
        const rawText = await extractText(file);
        const chunks = chunkText(rawText);
        uploadedDocs.push({ name: file.originalname, rawText, chunks });
      } catch (err) {
        errors.push(file.originalname);
        console.error(`[repositoryCheck] Extract failed for "${file.originalname}": ${err.message}`);
      }
    })
  );

  if (uploadedDocs.length === 0) {
    throw new Error("All uploaded files failed text extraction.");
  }

  const repoDocs = await fetchAllDocuments(sql);

  if (repoDocs.length === 0) {
    return {
      totalUploaded: uploadedDocs.length,
      totalRepoDoc: 0,
      results: uploadedDocs.map((d) => ({
        fileName: d.name,
        matches: [],
        highestScore: 0,
        topVerdict: verdict(0),
      })),
      summary: { totalMatches: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0 },
      errors,
      message: "Repository is empty. No comparisons performed.",
    };
  }

  const repoChunkMap = new Map();

  await Promise.all(
    repoDocs.map(async (doc) => {
      const rows = await fetchChunksForDocument(sql, doc.id);
      const chunks = rows
        .sort((a, b) => a.chunk_index - b.chunk_index)
        .map((r) => r.chunk_text);
      repoChunkMap.set(doc.id, chunks);
    })
  );

  const allRawTexts = [
    ...uploadedDocs.map((d) => d.rawText),
    ...repoDocs.map((d) => d.full_text),
  ];
  const idf = buildCorpusIDF(allRawTexts);

  const repoVectors = repoDocs.map((d) => buildVector(d.full_text, idf));
  const repoFingerprints = repoDocs.map((d) => winnow(d.full_text, WINNOW_K, WINNOW_W));

  const results = [];

  for (const uploaded of uploadedDocs) {
    const uploadedVector = buildVector(uploaded.rawText, idf);
    const uploadedFingerprint = winnow(uploaded.rawText, WINNOW_K, WINNOW_W);

    const matches = [];

    for (let r = 0; r < repoDocs.length; r++) {
      const repoDoc = repoDocs[r];

      const tfidfSim = cosineSimilarity(uploadedVector, repoVectors[r]);
      const fpSim = jaccardSimilarity(uploadedFingerprint, repoFingerprints[r]);
      const score = combinedScore(tfidfSim, fpSim, TFIDF_WEIGHT, FP_WEIGHT);

      if (score <= threshold) continue;

      const { phrases, words } = topSharedTerms(uploadedVector, repoVectors[r]);
      const intersection = [...uploadedFingerprint].filter((h) => repoFingerprints[r].has(h));
      const unionSize = uploadedFingerprint.size + repoFingerprints[r].size - intersection.length;

      const repoChunks = repoChunkMap.get(repoDoc.id) ?? [];
      const chunkResult = analyseChunkOverlap(uploaded.chunks, repoChunks);

      matches.push({
        uploadedFile: uploaded.name,
        repoDocumentId: repoDoc.id,
        repoFileName: repoDoc.file_name,
        tfidfScore: +tfidfSim.toFixed(4),
        fpScore: +fpSim.toFixed(4),
        combined: +score.toFixed(4),
        verdict: verdict(score),
        topPhrases: phrases.map((p) => p.replace(/_/g, " ")),
        topWords: words,
        sharedHashes: intersection.length,
        totalHashes: unionSize,
        avgChunkSimilarity: chunkResult.avgChunkSimilarity,
        maxChunkSimilarity: chunkResult.maxChunkSimilarity,
        hotspots: chunkResult.hotspots,
      });
    }

    matches.sort((a, b) => b.combined - a.combined);

    const topMatch = matches[0] ?? null;

    results.push({
      fileName: uploaded.name,
      matches,
      highestScore: topMatch ? topMatch.combined : 0,
      topVerdict: topMatch ? topMatch.verdict : verdict(0),
    });
  }

  const allMatches = results.flatMap((r) => r.matches);
  const summary = {
    totalMatches: allMatches.length,
    highRisk: allMatches.filter((m) => m.verdict.risk === "HIGH").length,
    mediumRisk: allMatches.filter((m) => m.verdict.risk === "MEDIUM").length,
    lowRisk: allMatches.filter((m) => m.verdict.risk === "LOW").length,
  };

  return {
    totalUploaded: uploadedDocs.length,
    totalRepoDoc: repoDocs.length,
    results,
    summary,
    errors,
  };
}