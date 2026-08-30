// src/routes/preferencesRoutes.js

const express = require('express');
const router = express.Router();

const authenticateToken = require('../middleware/authMiddleware');
const { getPreferences, savePreferences } = require('../controllers/preferencesController');

router.get('/', authenticateToken, getPreferences);
router.put('/', authenticateToken, savePreferences);

module.exports = router;