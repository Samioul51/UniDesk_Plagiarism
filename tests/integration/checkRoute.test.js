import request from "supertest";
import { jest } from "@jest/globals";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../../");

// Services mock

jest.unstable_mockModule(path.join(root, "src/config/db/dbConnect.js"), () => ({
    sql: {}
}));

jest.unstable_mockModule(path.join(root, "src/config/firebase/firebase.js"), () => ({
    auth: { verifyIdToken: jest.fn() }
}));

jest.unstable_mockModule(path.join(root, "src/services/chunkText.js"), () => ({
    chunkText: jest.fn()
}));

jest.unstable_mockModule(path.join(root, "src/services/extractText.js"), () => ({
    extractText: jest.fn()
}));

jest.unstable_mockModule(path.join(root, "src/services/internalCheck.js"), () => ({
    internalCheck: jest.fn()
}));

jest.unstable_mockModule(path.join(root, "src/services/onlineSearch.js"), () => ({
    onlineCheck: jest.fn()
}));

jest.unstable_mockModule(path.join(root, "src/services/repositoryCheck.js"), () => ({
    repositoryCheck: jest.fn()
}));

jest.unstable_mockModule(path.join(root, "src/services/saveToRepository.js"), () => ({
    saveToRepository: jest.fn()
}));

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

jest.unstable_mockModule(path.join(root, "src/middlewares/auth/auth.middleware.js"), () => ({
    verifyFirebaseToken: (req, res, next) => next()
}));

const { default: app } = await import("../../src/app.js");

describe("POST /api/check", () => {
    it("returns 400 when no files are uploaded", async () => {
        const response = await request(app).post("/api/check").send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("No files uploaded");
    });
});