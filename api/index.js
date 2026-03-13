import express from "express";
import cors from "cors";
import recipeRoutes from "../routes/recipes.js";

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://front-chef-recipes.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use("/api/recipes", recipeRoutes);

export default app;