import axios from "axios";
import { preprocessText } from "./preprocessText.js";

export const maxQueryChunks = 3;
export const maxResultsForQuery = 5;

export const pickImportantChunks = (chunks) => {
    if (!chunks || !chunks.length)
        return [];

    const scoredChunks = chunks
        .map((chunk) => {
            const processedWords = preprocessText(chunk);
            const uniqueWords = new Set(processedWords);

            return {
                chunk,
                processedWords,
                score: uniqueWords.size,
            };
        }).filter((item) => item.processedWords.length >= 8).sort((a, b) => b.score - a.score).slice(0, maxQueryChunks);

    return scoredChunks.map((item) => item.chunk);
};

export const buildSearchQuery = (chunk) => {
    const processedWords = preprocessText(chunk);

    if (!processedWords.length)
        return "";

    const queryWords = [...new Set(processedWords)].slice(0, 8);
    return queryWords.join(" ");
};

export const searchUsingSerper = async (query) => {
    try {
        if (!query) return [];

        const response = await axios.post(
            "https://google.serper.dev/search",
            {
                q: query,
                num: maxResultsForQuery,
                gl: "us",
                hl: "en",
            },
            {
                headers: {
                    "X-API-KEY": process.env.SERPER_API_KEY,
                    "Content-Type": "application/json",
                },
                timeout: 10000,
            }
        );

        const results = response.data?.organic || [];

        return results.map((item) => ({
            title: item.title || "Untitled",
            url: item.link || "",
            content: item.snippet || "",
        }));
    } catch (error) {
        console.error(error.response?.status, error.message);
        return [];
    }
};