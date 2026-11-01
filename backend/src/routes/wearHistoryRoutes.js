const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");

const {
    createWearHistory,
    getAllWearHistory,
    getWearHistoryById,
    updateWearHistory,
    deleteWearHistory
} = require("../controllers/wearHistoryController");


router.post("/", authenticateToken, createWearHistory);

router.get("/", authenticateToken, getAllWearHistory);

router.get("/:wear_id", authenticateToken, getWearHistoryById);

router.put("/:wear_id", authenticateToken, updateWearHistory);

router.delete("/:wear_id", authenticateToken, deleteWearHistory);


module.exports = router;