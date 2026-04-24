import { chunkText } from "../../src/services/chunkText.js";

describe("chunkText", () => {
    it("returns empty array for empty text", () => {
        expect(chunkText("")).toEqual([]);
    });

    it("creates multiple chunks from long text", () => {
        const text = Array.from({ length: 120 }, (_, i) => `word${i + 1}`).join(" ");
        const chunks = chunkText(text, 50, 10);

        expect(Array.isArray(chunks)).toBe(true);
        expect(chunks.length).toBeGreaterThan(1);
    });
});
