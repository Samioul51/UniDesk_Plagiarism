import express from "express";
import cors from "cors";
import checkRoutes from "./routes/checkRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server Running");
});

app.use("/api",checkRoutes);

export default app;