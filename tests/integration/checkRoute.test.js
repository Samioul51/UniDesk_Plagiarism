import request from "supertest";
import { jest } from "@jest/globals";

// dbConnect mock

jest.unstable_mockModule("../../src/config/db/dbConnect.js", () => ({
    sql: {}
}));

// Firebase mock

jest.unstable_mockModule("../../src/config/firebase/firebase.js", () => ({
    auth: {
        verifyIdToken: jest.fn()
    }
}));

// Service mocks

jest.unstable_mockModule("../../src/services/chunkText.js", () => ({
    chunkText: jest.fn()
}));

jest.unstable_mockModule("../../src/services/extractText.js", () => ({
    extractText: jest.fn()
}));

jest.unstable_mockModule("../../src/services/internalCheck.js", () => ({
    internalCheck: jest.fn()
}));

jest.unstable_mockModule("../../src/services/onlineSearch.js", () => ({
    onlineCheck: jest.fn()
}));

jest.unstable_mockModule("../../src/services/repositoryCheck.js", () => ({
    repositoryCheck: jest.fn()
}));

jest.unstable_mockModule("../../src/services/saveToRepository.js", () => ({
    saveToRepository: jest.fn()
}));

// Multer mock

jest.unstable_mockModule("multer", () => {
    const multer = () => ({
        array: () => (req, res, next) => {
            req.files = [];
            next();
        }
    });
    multer.memoryStorage = () => ({});
    return { default: multer };
});

const { default: app } = await import("../../src/app.js");

describe("POST /api/check", () => {
    it("returns 400 when no files are uploaded", async () => {
        const response = await request(app).post("/api/check").send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("No files uploaded");
    });
});
