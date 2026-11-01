// src/routes/profileRoutes.js

const express = require("express");

const router =
    express.Router();

const authenticateToken =
    require("../middleware/authMiddleware");

const {
    getProfile,
    updateProfile
} =
    require("../controllers/profileController");


// GET /api/profile
router.get(
    "/",
    authenticateToken,
    getProfile
);


// PUT /api/profile
router.put(
    "/",
    authenticateToken,
    updateProfile
);


module.exports = router;