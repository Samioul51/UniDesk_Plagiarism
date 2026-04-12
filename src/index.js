import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db/dbConnect.js";

const app = express();

const port = process.env.PORT;

app.use(cors());
app.use(express.json());

connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server running on ${port}`);
        });

    })
    .catch((error) => {
        console.log("Database connection failed", error.message);
    });

app.get("/", (req, res) => {
    res.send("Server Running");
});