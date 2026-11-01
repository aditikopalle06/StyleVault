// src/routes/outfitRoutes.js

const express = require('express');
const router = express.Router();

const authenticateToken = require('../middleware/authMiddleware');

const {
  createOutfit,
  getAllOutfits,
  getOutfitById,
  updateOutfit,
  deleteOutfit,
  toggleFavourite,
} = require('../controllers/outfitController');

// Every outfit route requires a valid JWT.

router.post('/', authenticateToken, createOutfit);

router.get('/', authenticateToken, getAllOutfits);

router.get('/:outfit_id', authenticateToken, getOutfitById);

router.put('/:outfit_id', authenticateToken, updateOutfit);

router.delete('/:outfit_id', authenticateToken, deleteOutfit);

router.patch('/:outfit_id/favourite', authenticateToken, toggleFavourite);

module.exports = router;