import express from "express";
import cors from "cors";
import recipeRoutes from "./routes/recipes.js";
import path from "path";
import userRoutes from "./routes/users.js";

const app = express();

// Middleware para parsear JSON
app.use(express.json());

// ⚡ CORS global: debe ir antes de las rutas
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://front-chef-recipes.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true, // permite enviar cookies si las necesitas
  })
);

// Servir carpeta uploads solo si quieres imágenes locales
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Rutas de usuarios
app.use("/api/users", userRoutes);

// Rutas de recetas
app.use("/api/recipes", recipeRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("API de Chef Recipes funcionando!");
});

export default app;