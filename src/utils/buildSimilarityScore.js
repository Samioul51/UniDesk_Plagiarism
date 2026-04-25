import { preprocessText, buildTokens } from "./preprocessText.js";
import { computeTF, computeIDF, computeTFIDF, topSharedTerms } from "./computeTfIdf.js";
import { cosineSimilarity, winnow, jaccardSimilarity, combinedScore, verdict } from "./calculateCosineSimilarity.js";

const ngramRange = [1, 3];
const tfidfWeight = 0.5;
const fpWeight = 0.5;

const buildVector = (rawText, idf) => {
    const tokens = preprocessText(rawText);
    const allTokens = buildTokens(tokens, ngramRange);
    const tf = computeTF(allTokens);
    return computeTFIDF(tf, idf);
};

export const buildSimilarityScore = (sourceText, targetText) => {
    const tokenizedDocs = [
        buildTokens(preprocessText(sourceText), ngramRange),
        buildTokens(preprocessText(targetText), ngramRange),
    ];

    const idf = computeIDF(tokenizedDocs);
    const vec1 = buildVector(sourceText, idf);
    const vec2 = buildVector(targetText, idf);

    const tfidfScore = cosineSimilarity(vec1, vec2);
    const fp1 = winnow(sourceText);
    const fp2 = winnow(targetText);
    const fpScore = jaccardSimilarity(fp1, fp2);
    const score = combinedScore(tfidfScore, fpScore, tfidfWeight, fpWeight);

    const shared = topSharedTerms(vec1, vec2);

    return {
        tfidfScore: +tfidfScore.toFixed(4),
        fpScore: +fpScore.toFixed(4),
        combined: +score.toFixed(4),
        verdict: verdict(score),
        topPhrases: shared.phrases.map((p) => p.replace(/_/g, " ")),
        topWords: shared.words,
    };
};
