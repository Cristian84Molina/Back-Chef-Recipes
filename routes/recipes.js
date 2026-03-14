import express from "express";
import { pool } from "../db.js";
import multer from "multer";
import { v2 as cloudinary} from "cloudinary"



const upload = multer({ storage: multer.memoryStorage() });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const router = express.Router();

// 🟢 Importante: /search antes de /:id
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    const result = await pool.query(
      "SELECT * FROM recipes WHERE LOWER(name) LIKE $1",
      [`%${q.toLowerCase()}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error buscando recetas");
  }
});

// Traer todas las recetas
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM recipes");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error trayendo recetas");
  }
});

// Traer receta por id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM recipes WHERE id=$1", [id]);
    if (result.rows.length === 0) return res.status(404).send("Receta no encontrada");
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error trayendo receta");
  }
});

// Guardar receta
router.post("/", upload.single("photo"), async (req, res) => {
  try {
    const { name, category, type, ingredients, description } = req.body;

    let imageUrl = null;

    // Si hay imagen la subimos a Cloudinary
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

    const dbResult = await pool.query(
      `INSERT INTO recipes (name, category, type, ingredients, description, image)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [name, category, type, ingredients, description, imageUrl]
    );

    res.json(dbResult.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error guardando receta");
  }
});

// Actualizar receta
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, type, ingredients, description } = req.body;
    const result = await pool.query(
      "UPDATE recipes SET name=$1, category=$2, type=$3, ingredients=$4, description=$5 WHERE id=$6 RETURNING *",
      [name, category, type, ingredients, description, id]
    );
    if (result.rows.length === 0) return res.status(404).send("Receta no encontrada");
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error actualizando receta");
  }
});

// Eliminar receta
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM recipes WHERE id=$1 RETURNING *", [id]);
    if (result.rows.length === 0) return res.status(404).send("Receta no encontrada");
    res.json({ message: "Receta eliminada correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error eliminando receta");
  }
});

export default router;