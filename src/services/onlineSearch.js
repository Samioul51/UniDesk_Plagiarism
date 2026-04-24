import { buildSearchQuery, maxResultsForQuery, pickImportantChunks, searchSearxng } from "../utils/searXNG.js";

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
                const searchResults = await searchSearxng(query);

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

            finalResults.push({
                fileName: doc.fileName,
                totalQueries: importantChunks.length,
                totalMatches: uniqueResults.length,
                matches: uniqueResults
            });
        }
        
        return finalResults;
    } catch (error) {
        throw new Error(error.message);
    }
};