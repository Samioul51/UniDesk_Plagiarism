import { sql } from "../config/db/dbConnect.js";
import { chunkText } from "../services/chunkText.js";
import { extractText } from "../services/extractText.js";
import { internalCheck } from "../services/internalCheck.js";
import { onlineCheck } from "../services/onlineSearch.js";
import { repositoryCheck } from "../services/repositoryCheck.js";
import { saveToRepository } from "../services/saveToRepository.js";
import { parseBoolean } from "../utils/parseBoolean.js";

export const checkPlagiarism = async (req, res) => {
    try {
        const files = req.files;
        const shouldStore = parseBoolean(req.body.storeInRepository);

        if (!files || files.length === 0)
            return res.status(400).json({
                success: false,
                message: "No files uploaded"
            });

        const documentResults = [];
        const processedDocs = [];
        const processingErrors = [];

        for (const file of files) {
            try {
                const extractedText = await extractText(file);

                // For online and db check

                const chunks = chunkText(extractedText);

                let repositoryInfo = null;

                if (shouldStore)
                    repositoryInfo = await saveToRepository({
                        fileName: file.originalname,
                        fullText: extractedText,
                        chunks
                    });

                processedDocs.push({
                    fileName: file.originalname,
                    mimetype: file.mimetype,
                    extractedText,
                    chunks
                });

                documentResults.push({
                    fileName: file.originalname,
                    mimetype: file.mimetype,
                    extractedTextLength: extractedText.length,
                    totalChunks: chunks.length,
                    storedInRepository: shouldStore,
                    repositoryInfo
                });

            } catch (error) {
                processingErrors.push({
                    fileName: file.originalname,
                    message: error.message
                })
            }
        }

        if(!processedDocs.length)
            return res.status(400).json({
                success:false,
                message:"All uploaded files failed to process",
                errors:processingErrors
            });

        const [internalResults,repositoryResults,onlineResults]=await Promise.all([
            internalCheck(files),
            repositoryCheck(files,sql),
            onlineCheck(processedDocs)
        ])

        return res.status(200).json({
            success: true,
            message: "Plagiarism check completed successfully",
            totalFiles: files.length,
            storeInRepository:shouldStore,
            documents:documentResults,
            internalResults,
            repositoryResults,
            onlineResults,
            errors: processingErrors
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to complete Plagiarism check",
            error:error.message
        });
    }
};