import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db/dbConnect.js";


const port = process.env.PORT;


connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server running on ${port}`);
        });

    })
    .catch((error) => {
        console.log("Database connection failed", error.message);
    });

