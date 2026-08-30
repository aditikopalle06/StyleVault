// src/controllers/clothingController.js

const pool = require('../config/db');

/**
 * POST /api/clothing
 * Creates a new clothing item belonging to the logged-in user.
 */
async function createClothing(req, res) {
  try {
    const userId = req.user.user_id;
    const {
      name,
      category,
      colour,
      season,
      price,
      image,
      size,
      occasion,
      extra_info,
    } = req.body;

    // Basic validation — these three are NOT NULL in the schema.
    if (!name || !category || !colour) {
      return res.status(400).json({
        error: 'name, category and colour are required.',
      });
    }

    const result = await pool.query(
      `INSERT INTO clothing
        (user_id, name, category, colour, season, price, image, size, occasion, extra_info)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [userId, name, category, colour, season, price, image, size, occasion, extra_info]
    );

    return res.status(201).json({
      message: 'Clothing item created successfully.',
      item: result.rows[0],
    });
  } catch (error) {
    console.error('Error in createClothing():', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * GET /api/clothing
 * Returns all clothing items belonging to the logged-in user only.
 */
async function getAllClothing(req, res) {
  try {
    const userId = req.user.user_id;

    const result = await pool.query(
      `SELECT * FROM clothing WHERE user_id = $1 ORDER BY item_id`,
      [userId]
    );

    return res.status(200).json({ items: result.rows });
  } catch (error) {
    console.error('Error in getAllClothing():', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * GET /api/clothing/:item_id
 * Returns a single clothing item — only if it belongs to the logged-in user.
 */
async function getClothingById(req, res) {
  try {
    const userId = req.user.user_id;
    const { item_id } = req.params;

    const result = await pool.query(
      `SELECT * FROM clothing WHERE item_id = $1 AND user_id = $2`,
      [item_id, userId]
    );

    if (result.rows.length === 0) {
      // Same 404 whether the item doesn't exist at all, or exists but
      // belongs to someone else — we never reveal which.
      return res.status(404).json({ error: 'Clothing item not found.' });
    }

    return res.status(200).json({ item: result.rows[0] });
  } catch (error) {
    console.error('Error in getClothingById():', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * PUT /api/clothing/:item_id
 * Updates a clothing item — only if it belongs to the logged-in user.
 */
async function updateClothing(req, res) {
  try {
    const userId = req.user.user_id;
    const { item_id } = req.params;
    const {
      name,
      category,
      colour,
      season,
      price,
      image,
      size,
      occasion,
      extra_info,
    } = req.body;

    if (!name || !category || !colour) {
      return res.status(400).json({
        error: 'name, category and colour are required.',
      });
    }

    const result = await pool.query(
      `UPDATE clothing
       SET name = $1,
           category = $2,
           colour = $3,
           season = $4,
           price = $5,
           image = $6,
           size = $7,
           occasion = $8,
           extra_info = $9
       WHERE item_id = $10 AND user_id = $11
       RETURNING *`,
      [name, category, colour, season, price, image, size, occasion, extra_info, item_id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Clothing item not found.' });
    }

    return res.status(200).json({
      message: 'Clothing item updated successfully.',
      item: result.rows[0],
    });
  } catch (error) {
    console.error('Error in updateClothing():', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * DELETE /api/clothing/:item_id
 * Deletes a clothing item — only if it belongs to the logged-in user.
 */
async function deleteClothing(req, res) {
  try {
    const userId = req.user.user_id;
    const { item_id } = req.params;

    const result = await pool.query(
      `DELETE FROM clothing WHERE item_id = $1 AND user_id = $2 RETURNING item_id`,
      [item_id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Clothing item not found.' });
    }

    return res.status(200).json({
      message: 'Clothing item deleted successfully.',
      item_id: result.rows[0].item_id,
    });
  } catch (error) {
    console.error('Error in deleteClothing():', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = {
  createClothing,
  getAllClothing,
  getClothingById,
  updateClothing,
  deleteClothing,
};