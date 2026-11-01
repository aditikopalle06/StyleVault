// src/routes/clothingRoutes.js

const express = require('express');
const router = express.Router();

const multer = require('multer');
const { removeImageBackground } = require('../controllers/imageController');

const authenticateToken = require('../middleware/authMiddleware');
const {
  createClothing,
  getAllClothing,
  getClothingById,
  updateClothing,
  deleteClothing,
} = require('../controllers/clothingController');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPG, PNG, and WebP images are allowed.'));
        }
    }
});

// Every route below requires a valid JWT — authenticateToken runs
// first and sets req.user before any controller function runs.
router.post(
    '/remove-background',
    authenticateToken,
    upload.single('file'),
    removeImageBackground
);
router.post('/', authenticateToken, createClothing);
router.get('/', authenticateToken, getAllClothing);
router.get('/:item_id', authenticateToken, getClothingById);
router.put('/:item_id', authenticateToken, updateClothing);
router.delete('/:item_id', authenticateToken, deleteClothing);

module.exports = router;
