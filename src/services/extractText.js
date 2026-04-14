import pdfParse from "pdf-parse";

export const extractText=async(file)=>{
    try {
        if(!file)
            throw new Error("No file provided");

        if(file.mimetype==="application/pdf"){
            const data=await pdfParse(file.buffer);
            return data.text?.trim() || "";
        }

        if(file.mimetype==="text/plain")
            return file.buffer.toString("utf-8").trim();

        throw new Error("Unsupported file type");
    } catch (error) {
        throw new Error(error.message);
    }
};

