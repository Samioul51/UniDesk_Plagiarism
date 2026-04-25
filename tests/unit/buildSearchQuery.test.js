import { buildSearchQuery } from "../../src/utils/serperUse.js";

describe("buildSearchQuery", () => {
    it("returns a non-empty string query", () => {
        const chunk = "Machine learning improves image quality assessment and helps researchers compare visual performance effectively.";

        const query = buildSearchQuery(chunk);

        expect(typeof query).toBe("string");
        expect(query.length).toBeGreaterThan(0);
    });
});
