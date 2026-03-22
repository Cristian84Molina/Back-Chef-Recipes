import express from "express";
import { pool } from "../db.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { authMiddleware } from "../middleware/auth.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// Configuración Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ======================
// 🔍 Búsqueda de recetas públicas
// ======================
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    const result = await pool.query(
      `SELECT * FROM recipes 
       WHERE LOWER(name) LIKE $1 AND is_public = true`,
      [`%${q.toLowerCase()}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error buscando recetas");
  }
});

// ======================
// 📄 Traer todas las recetas públicas
// ======================
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM recipes WHERE is_public = true");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error trayendo recetas");
  }
});

// ======================
// 📄 Traer receta por ID (solo pública o propia)
// ======================
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM recipes WHERE id=$1", [id]);

    if (result.rows.length === 0) return res.status(404).send("Receta no encontrada");

    const recipe = result.rows[0];

    // Validar acceso: pública o dueño
    if (!recipe.is_public && recipe.user_id !== req.user.id)
      return res.status(403).json({ error: "No permitido" });

    res.json(recipe);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error trayendo receta");
  }
});

// ======================
// 📄 Traer recetas del usuario logueado
// ======================
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM recipes WHERE user_id=$1", [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error trayendo tus recetas");
  }
});

// ======================
// ➕ Crear receta (usuario autenticado)
// ======================
router.post("/", authMiddleware, upload.single("photo"), async (req, res) => {
  try {
    const { name, category, type, ingredients, description, is_public } = req.body;
    const userId = req.user.id;

    let imageUrl = null;
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "recipes" }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          })
          .end(req.file.buffer);
      });
      imageUrl = result.secure_url;
    }

    const ingredientsJSON = typeof ingredients === "string" ? ingredients : JSON.stringify(ingredients);

    const dbResult = await pool.query(
      `INSERT INTO recipes (name, category, type, ingredients, description, image, user_id, is_public)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [name, category, type, ingredientsJSON, description, imageUrl, userId, is_public || false]
    );

    res.json(dbResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error guardando receta");
  }
});

// ======================
// ✏️ Actualizar receta (solo dueño)
// ======================
router.put("/:id", authMiddleware, upload.single("photo"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, type, ingredients, description, is_public } = req.body;
    const userId = req.user.id;

    // Validar dueño
    const recipeCheck = await pool.query("SELECT * FROM recipes WHERE id=$1", [id]);
    if (recipeCheck.rows.length === 0) return res.status(404).send("Receta no encontrada");
    if (recipeCheck.rows[0].user_id !== userId) return res.status(403).send("No permitido");

    let imageUrl = recipeCheck.rows[0].image;

    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: "recipes" }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }).end(req.file.buffer);
      });
      imageUrl = result.secure_url;
    }

    const ingredientsJSON = typeof ingredients === "string" ? ingredients : JSON.stringify(ingredients);

    const query =
      "UPDATE recipes SET name=$1, category=$2, type=$3, ingredients=$4, description=$5, image=$6, is_public=$7 WHERE id=$8 RETURNING *";
    const values = [name, category, type, ingredientsJSON, description, imageUrl, is_public || false, id];

    const updated = await pool.query(query, values);
    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error actualizando receta");
  }
});

// ======================
// 🗑️ Eliminar receta (solo dueño)
// ======================
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const recipeCheck = await pool.query("SELECT * FROM recipes WHERE id=$1", [id]);
    if (recipeCheck.rows.length === 0) return res.status(404).send("Receta no encontrada");
    if (recipeCheck.rows[0].user_id !== userId) return res.status(403).send("No permitido");

    await pool.query("DELETE FROM recipes WHERE id=$1", [id]);
    res.json({ message: "Receta eliminada correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error eliminando receta");
  }
});

export default router;