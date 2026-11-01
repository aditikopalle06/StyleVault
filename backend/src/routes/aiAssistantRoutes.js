
const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const { chatWithAssistant } = require("../controllers/aiAssistantController");

router.post("/chat", authenticateToken, chatWithAssistant);

module.exports = router;
