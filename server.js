import express from "express";
import cors from "cors";
import recipesRoutes from "./routes/recipes.js";
import dotenv from "dotenv";
dotenv.config();
import path from "path";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/recipes", recipesRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));