const pool = require("../config/db");


// Create a calendar event
async function createCalendarEvent(req, res) {
    try {
        const userId = req.user.user_id;

        const {
            outfit_id,
            event_name,
            event_date,
            event_time
        } = req.body;

        // Basic validation
        if (!outfit_id || !event_name || !event_date) {
            return res.status(400).json({
                error: "Outfit, event name and event date are required."
            });
        }

        // Check that the outfit belongs to the logged-in user
        const outfitResult = await pool.query(
            `
            SELECT outfit_id
            FROM outfit
            WHERE outfit_id = $1
              AND user_id = $2
            `,
            [outfit_id, userId]
        );

        if (outfitResult.rows.length === 0) {
            return res.status(404).json({
                error: "Outfit not found."
            });
        }

        // Create calendar event
        const result = await pool.query(
            `
            INSERT INTO calendar_event
            (
                user_id,
                outfit_id,
                event_name,
                event_date,
                event_time
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            `,
            [
                userId,
                outfit_id,
                event_name,
                event_date,
                event_time || null
            ]
        );

        return res.status(201).json({
            message: "Calendar event created successfully.",
            event: result.rows[0]
        });

    } catch (error) {
        console.error("Create calendar event error:", error);

        return res.status(500).json({
            error: "Failed to create calendar event."
        });
    }
}


// Get all calendar events for the logged-in user
async function getAllCalendarEvents(req, res) {
    try {
        const userId = req.user.user_id;

        const result = await pool.query(
            `
            SELECT
                ce.event_id,
                ce.user_id,
                ce.outfit_id,
                ce.event_name,
                ce.event_date::text AS event_date,
                ce.event_time,
                o.outfit_name,
                o.occasion,
                o.favourite
            FROM calendar_event ce
            INNER JOIN outfit o
                ON ce.outfit_id = o.outfit_id
            WHERE ce.user_id = $1
            ORDER BY ce.event_date ASC, ce.event_time ASC
            `,
            [userId]
        );

        return res.status(200).json({
            events: result.rows
        });

    } catch (error) {
        console.error("Get calendar events error:", error);

        return res.status(500).json({
            error: "Failed to fetch calendar events."
        });
    }
}


// Get one calendar event
async function getCalendarEventById(req, res) {
    try {
        const userId = req.user.user_id;
        const { event_id } = req.params;

        const result = await pool.query(
            `
            SELECT
                ce.event_id,
                ce.user_id,
                ce.outfit_id,
                ce.event_name,
                ce.event_date::text AS event_date,
                ce.event_time,
                o.outfit_name,
                o.occasion,
                o.favourite
            FROM calendar_event ce
            INNER JOIN outfit o
                ON ce.outfit_id = o.outfit_id
            WHERE ce.event_id = $1
              AND ce.user_id = $2
            `,
            [event_id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Calendar event not found."
            });
        }

        return res.status(200).json({
            event: result.rows[0]
        });

    } catch (error) {
        console.error("Get calendar event error:", error);

        return res.status(500).json({
            error: "Failed to fetch calendar event."
        });
    }
}


// Update a calendar event
async function updateCalendarEvent(req, res) {
    try {
        const userId = req.user.user_id;
        const { event_id } = req.params;

        const {
            outfit_id,
            event_name,
            event_date,
            event_time
        } = req.body;

        // Basic validation
        if (!outfit_id || !event_name || !event_date) {
            return res.status(400).json({
                error: "Outfit, event name and event date are required."
            });
        }

        // Check that the outfit belongs to the user
        const outfitResult = await pool.query(
            `
            SELECT outfit_id
            FROM outfit
            WHERE outfit_id = $1
              AND user_id = $2
            `,
            [outfit_id, userId]
        );

        if (outfitResult.rows.length === 0) {
            return res.status(404).json({
                error: "Outfit not found."
            });
        }

        // Update event
        const result = await pool.query(
            `
            UPDATE calendar_event
            SET
                outfit_id = $1,
                event_name = $2,
                event_date = $3,
                event_time = $4
            WHERE event_id = $5
              AND user_id = $6
            RETURNING *
            `,
            [
                outfit_id,
                event_name,
                event_date,
                event_time || null,
                event_id,
                userId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Calendar event not found."
            });
        }

        return res.status(200).json({
            message: "Calendar event updated successfully.",
            event: result.rows[0]
        });

    } catch (error) {
        console.error("Update calendar event error:", error);

        return res.status(500).json({
            error: "Failed to update calendar event."
        });
    }
}


// Delete a calendar event
async function deleteCalendarEvent(req, res) {
    try {
        const userId = req.user.user_id;
        const { event_id } = req.params;

        const result = await pool.query(
            `
            DELETE FROM calendar_event
            WHERE event_id = $1
              AND user_id = $2
            RETURNING *
            `,
            [event_id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Calendar event not found."
            });
        }

        return res.status(200).json({
            message: "Calendar event deleted successfully.",
            event: result.rows[0]
        });

    } catch (error) {
        console.error("Delete calendar event error:", error);

        return res.status(500).json({
            error: "Failed to delete calendar event."
        });
    }
}


module.exports = {
    createCalendarEvent,
    getAllCalendarEvents,
    getCalendarEventById,
    updateCalendarEvent,
    deleteCalendarEvent
};