import axios from "axios";
import { preprocessText } from "./preprocessText.js";

export const maxQueryChunks = 3;
export const maxResultsForQuery = 5;

export const pickImportantChunks = (chunks) => {
    if (!chunks || !chunks.length)
        return [];

    const scoredChunks = chunks.map((chunk) => {
        const processedWords = preprocessText(chunk);
        const uniqueWords = new Set(processedWords);


        return {
            chunk,
            score: processedWords.length + uniqueWords.size
        };
    }).sort((a, b) => b.score - a.score).slice(0, maxQueryChunks);

    return scoredChunks.map((item) => item.chunk);
};


export const buildSearchQuery = (chunk) => {
    const processedWords = preprocessText(chunk).slice(0, 20);
    const query = processedWords.join(" ");
    return query ? `"${query}"` : "";
};

export const searchSearxng = async (query) => {
    try {
        if (!query)
            return [];

        const response = await axios.get(`${process.env.SEARXNG_BASE_URL}/search`, {
            params: {
                q: query,
                format: "json",
                language: "en",
                pageno: 1,
            },
            timeout: 15000,
            headers: {
                "User-Agent": "Mozilla/5.0",
            },
        });

        return response.data?.results || [];
    } catch (error) {
        return [];
    }
};