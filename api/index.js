import express from "express";
import cors from "cors";
import recipeRoutes from "../routes/recipes.js";

const app = express();

app.use(cors());
app.use(express.json());

// rutas
app.use("/api/recipes", recipeRoutes);

export default app;