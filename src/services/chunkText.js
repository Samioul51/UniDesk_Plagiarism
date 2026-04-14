export const chunkText = (text, chunkSize = 50, overlap = 10) => {
    if (!text)
        return [];

    const words = text.split(/\s+/)
    const chunks = [];

    for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
        const chunk = words.slice(i, i + chunkSize).join(" ");

        if(chunk.length)
            chunks.push(chunk);
    }
    return chunks;
};