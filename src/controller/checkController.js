import { chunkText } from "../services/chunkText.js";
import { extractText } from "../services/extractText.js";
import { onlineCheck } from "../services/onlineSearch.js";
import { saveToRepository } from "../services/saveToRepository.js";
import { preprocessText } from "../utils/preprocessText.js";

export const checkPlagiarism = async (req, res) => {
    try {
        const files = req.files;
        const { storeInRepository } = req.body;

        if (!files || files.length === 0)
            return res.status(400).json({
                success: false,
                message: "No files uploaded"
            });

        const results = [];
        const processedDocs = [];
        const shouldStore = storeInRepository === ("true" || true);

        for (const file of files) {
            const extractedText = await extractText(file);
            const preprocessedText = preprocessText(extractedText);

            // For online and db check

            const chunks = chunkText(extractedText);

            let repositoryInfo = null;

            if (storeInRepository)
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

            results.push({
                fileName: file.originalname,
                mimetype: file.mimetype,
                extractedTextLength: extractedText.length,
                totalChunks: chunks.length,
                storedInRepository: storeInRepository === true,
                repositoryInfo
            });
        }

        const onlineResults = await onlineCheck(processedDocs);

        return res.status(200).json({
            success: true,
            message: "Files processed successfully",
            totalFiles: files.length,
            results,
            onlineResults
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};