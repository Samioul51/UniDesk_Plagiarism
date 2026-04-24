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

// Upload limit mock

jest.unstable_mockModule("../../src/middlewares/upload/upload.js", () => ({
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

const { default: app } = await import("../../src/app.js");

describe("POST /api/check", () => {
    it("returns 400 when no files are uploaded", async () => {
        const response = await request(app).post("/api/check").send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("No files uploaded");
    });
});
