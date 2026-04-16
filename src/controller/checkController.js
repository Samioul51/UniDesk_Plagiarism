import { chunkText } from "../services/chunkText.js";
import { extractText } from "../services/extractText.js";
import { saveToRepository } from "../services/saveToRepository.js";

export const checkPlagiarism = async (req, res) => {
    try {
        const files = req.files;
        const { storeInRepository } = req.body;

        if(!files || files.length===0)
            return res.status(400).json({
                success:false,
                message:"No files uploaded"
            });

        const results=[];

        for(const file of files){
            const extractedText=await extractText(file);

            const chunks=chunkText(extractedText);

            let repositoryInfo=null;

            if(storeInRepository)
                repositoryInfo=await saveToRepository({
                    fileName:file.originalname,
                    fullText:extractedText,
                    chunks
                });

            results.push({
                fileName:file.originalname,
                mimetype:file.mimetype,
                extractedTextLength:extractedText.length,
                totalChunks:chunks.length,
                storedInRepository: storeInRepository===true,
                repositoryInfo
            });
        }

        return res.status(200).json({
            success:true,
            message:"Files processed successfully",
            totalFiles:files.length,
            results
        });
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:error.message
        });
    }
};