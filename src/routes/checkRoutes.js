import express from "express";
import { checkPlagiarism } from "../controller/checkController.js";
import { verifyFirebaseToken } from "../middlewares/auth/auth.middleware.js";
import upload from "../middlewares/upload/upload.js";

const router = express.Router();

router.post("/check", verifyFirebaseToken, upload.array("files", 5), checkPlagiarism);

export default router;
