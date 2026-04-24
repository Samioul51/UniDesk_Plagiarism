import request from "supertest";
import { jest } from "@jest/globals";

// dbConnect mock

jest.unstable_mockModule("../../src/config/db/dbConnect.js", () => ({
    sql: {}
}));

// Upload limit mock

jest.unstable_mockModule("../../src/middlewares/Upload/upload.js", () => ({
    default: {
        array: () => (req, res, next) => {
            req.files = [];
            next();
        }
    }
}));

// Authentication mock

jest.unstable_mockModule("../../src/middlewares/auth/auth.middleware.js", () => ({
    verifyFirebaseToken: (req, res, next) => next()
}));

let app;

beforeAll(async () => {
    const module = await import("../../src/app.js");
    app = module.default;
});

describe("POST /api/check", () => {
    it("returns 400 when no files are uploaded", async () => {
        const response = await request(app).post("/api/check").send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("No files uploaded");
    });
});
