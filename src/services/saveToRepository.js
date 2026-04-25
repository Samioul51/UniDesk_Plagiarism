import { sql } from "../config/db/dbConnect.js";

export const saveToRepository = async ({ fileName, fullText, chunks }) => {
    try {
        if (!fileName || !fullText)
            throw new Error("File name and full text are required");

        const documentResult = await sql`
            insert into documents (file_name, full_text) values  (${fileName}, ${fullText})
            returning id,file_name
        `;

        const document=documentResult[0];
        const documentId=document.id;

        if(chunks && chunks.length>0){
            for(let i=0;i<chunks.length;i+=1){
                await sql`
                    insert into document_chunks (document_id,chunk_index,chunk_text)
                    values (${documentId},${i},${chunks[i]})
                `;
            }
        }

        return {
            success:true,
            documentId,
            fileName:document.file_name,
            totalChunks:chunks?.length || 0
        };
    } catch (error) {
        throw new Error(error.message);
    }
};