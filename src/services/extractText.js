import { createRequire } from "module";
import mammoth from "mammoth";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

export const extractText = async (file) => {
    try {
        if (!file)
            throw new Error("No file provided");

        if (file.mimetype === "application/pdf") {
            const data = new PDFParse({
                data: file.buffer
            });
            
            const result=await data.getText();
            return result.text?.trim() || "";
        }

        if (file.mimetype === "text/plain")
            return file.buffer.toString("utf-8").trim();

        if(file.mimetype==="application/vnd.openxmlformats-officedocument.wordprocessingml.document"){
            const result=await mammoth.extractRawText({buffer:file.buffer});
            return result.value?.trim() || "";
        }

        throw new Error("Unsupported file type");
    } catch (error) {
        throw new Error(error.message);
    }
};

