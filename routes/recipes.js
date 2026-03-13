import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// Actualizar receta
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, type, ingredients, description } = req.body;

    const result = await pool.query(
      `UPDATE recipes 
       SET name=$1, category=$2, type=$3, ingredients=$4, description=$5
       WHERE id=$6
       RETURNING *`,
      [name, category, type, ingredients, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Receta no encontrada");
    }

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

    const result = await pool.query(
      "DELETE FROM recipes WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Receta no encontrada");
    }

    res.json({ message: "Receta eliminada correctamente" });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error eliminando receta");
  }
});

// Guardar receta
router.post("/", async (req, res) => {
  try {
    const { name, category, type, ingredients, description } = req.body;

    const result = await pool.query(
      "INSERT INTO recipes (name, category, type, ingredients, description, image) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
      [name, category, type, ingredients, description, null]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error guardando receta");
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

// Buscar recetas por nombre
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

// Traer receta por id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM recipes WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Receta no encontrada");
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error trayendo receta");
  }
});

export default router;