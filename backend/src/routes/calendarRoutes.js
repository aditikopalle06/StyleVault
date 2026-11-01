const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");

const {
    createCalendarEvent,
    getAllCalendarEvents,
    getCalendarEventById,
    updateCalendarEvent,
    deleteCalendarEvent
} = require("../controllers/calendarController");


// Create calendar event
router.post(
    "/",
    authenticateToken,
    createCalendarEvent
);


// Get all calendar events
router.get(
    "/",
    authenticateToken,
    getAllCalendarEvents
);


// Get one calendar event
router.get(
    "/:event_id",
    authenticateToken,
    getCalendarEventById
);


// Update calendar event
router.put(
    "/:event_id",
    authenticateToken,
    updateCalendarEvent
);


// Delete calendar event
router.delete(
    "/:event_id",
    authenticateToken,
    deleteCalendarEvent
);


module.exports = router;