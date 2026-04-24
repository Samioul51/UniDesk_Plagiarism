import { buildSimilarityScore } from "../utils/buildSimilarityScore.js";
import { delay } from "../utils/delay.js";
import { fetchWebPageText } from "../utils/fetchWebPageText.js";
import { buildSearchQuery, maxResultsForQuery, pickImportantChunks, searchUsingSerper } from "../utils/serperUse.js";

const maxFetchedPagesPerDoc = 5;
const minOnlineScore = 0.1;

export const onlineCheck = async (processedDocs) => {
    try {
        if (!processedDocs || !processedDocs.length)
            throw new Error("No processed documents provided");

        const finalResults = [];

        for (const doc of processedDocs) {
            const importantChunks = pickImportantChunks(doc.chunks || []);

            const collectedResults = [];

            for (const chunk of importantChunks) {
                const query = buildSearchQuery(chunk);

                if (!query)
                    continue;

                await delay(1500);

                const searchResults = await searchUsingSerper(query);

                const mappedResults = searchResults.slice(0, maxResultsForQuery).map((item) => ({
                    title: item.title || "Untitled",
                    url: item.url || "",
                    content: item.content || "",
                    query
                }));

                collectedResults.push(...mappedResults);
            }

            const uniqueResults = [];

            const seenURLS = new Set();

            for (const item of collectedResults) {
                if (item.url && !seenURLS.has(item.url)) {
                    seenURLS.add(item.url);
                    uniqueResults.push(item);
                }
            }

            const limitedResults = uniqueResults.slice(0, maxFetchedPagesPerDoc);
            const verifiedMatches = [];

            for (const item of limitedResults) {
                await delay(2000);
                const pageText = await fetchWebPageText(item.url);

                if (!pageText || pageText.length < 100)
                    continue;

                const similarity = buildSimilarityScore(doc.extractedText, pageText);

                if (similarity.combined < minOnlineScore)
                    continue;

                verifiedMatches.push({
                    title: item.title,
                    url: item.url,
                    snippet: item.content,
                    query: item.query,
                    ...similarity,
                });
            }

            verifiedMatches.sort((a, b) => b.combined - a.combined);

            finalResults.push({
                fileName: doc.fileName,
                totalQueries: importantChunks.length,
                totalCandidates: uniqueResults.length,
                totalMatches: verifiedMatches.length,
                highestScore: verifiedMatches[0]?.combined || 0,
                matches: verifiedMatches
            });
        }

        return finalResults;
    } catch (error) {
        throw new Error(error.message);
    }
};