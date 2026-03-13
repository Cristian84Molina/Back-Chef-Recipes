import express from "express";
import cors from "cors";
import recipeRoutes from "./routes/recipes.js";
import path from "path";

const app = express();

// Middleware para parsear JSON
app.use(express.json());

// CORS global
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://front-chef-recipes.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

// Servir carpeta uploads solo si quieres imágenes locales (en serverless no se guardan)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Rutas de recetas
app.use("/api/recipes", recipeRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("API de Chef Recipes funcionando!");
});

export default app;