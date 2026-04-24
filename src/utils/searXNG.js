import axios from "axios";

export const maxQueryChunks = 3;
export const maxResultsForQuery = 5;

export const pickImportantChunks = (chunks) => {
    return chunks.filter((chunk) => chunk && chunk.trim().length > 80).slice(0, maxQueryChunks);
};

export const buildSearchQuery = (chunk) => {
    const words = chunk.trim().split(/\s+/).slice(0, 20).join(" ");
    return `"${words}"`;
};

export const searchSearxng = async (query) => {
    try {
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