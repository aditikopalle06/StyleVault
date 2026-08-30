// src/routes/clothingRoutes.js

const express = require('express');
const router = express.Router();

const authenticateToken = require('../middleware/authMiddleware');
const {
  createClothing,
  getAllClothing,
  getClothingById,
  updateClothing,
  deleteClothing,
} = require('../controllers/clothingController');

// Every route below requires a valid JWT — authenticateToken runs
// first and sets req.user before any controller function runs.

router.post('/', authenticateToken, createClothing);
router.get('/', authenticateToken, getAllClothing);
router.get('/:item_id', authenticateToken, getClothingById);
router.put('/:item_id', authenticateToken, updateClothing);
router.delete('/:item_id', authenticateToken, deleteClothing);

module.exports = router;