// api/index.js
import express from "express";
import cors from "cors";
import recipeRoutes from "../routes/recipes.js";
import path from "path";

const app = express();

// Middleware para parsear JSON
app.use(express.json());

// CORS
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://front-chef-recipes.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// Servir carpeta uploads para imágenes
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Rutas de recetas
app.use("/api/recipes", recipeRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("API de Chef Recipes funcionando!");
});

export default app;