import multer from "multer";
import path from "path";

const storage=multer.memoryStorage();

const fileFilter=(req,file,callback)=>{
    const ext=path.extname(file.originalname).toLowerCase();
    const mime=file.mimetype;

    const allowedExtensions=[".pdf",".txt"];
    const allowedMimeTypes=["application/pdf","text/plain"];

    if(!allowedExtensions.includes(ext) || !allowedMimeTypes.includes(mime))
        return callback(new Error("Only PDF and Text files are allowed"));

    callback(null,true);
};

// Highest 5 files with maximum size of 10 MB for each file

const upload=multer({
    storage,
    fileFilter,
    limits:{
        fileSize:10*1024*1024, 
        files:5
    }
});

export default upload