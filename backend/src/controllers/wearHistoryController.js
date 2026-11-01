const pool = require("../config/db");


// =====================================================
// CREATE WEAR HISTORY
// =====================================================

async function createWearHistory(req, res) {
    try {
        const userId = req.user.user_id;

        const {
            item_id,
            wear_date,
            rating,
            notes
        } = req.body;


        if (!item_id || !wear_date) {
            return res.status(400).json({
                error: "Item and wear date are required."
            });
        }


        // Check that the clothing item belongs
        // to the logged-in user
        const itemCheck = await pool.query(
            `SELECT item_id
             FROM clothing
             WHERE item_id = $1
               AND user_id = $2`,
            [
                item_id,
                userId
            ]
        );


        if (itemCheck.rows.length === 0) {
            return res.status(404).json({
                error: "Clothing item not found."
            });
        }


        // Explicitly store as PostgreSQL DATE
        const result = await pool.query(
            `INSERT INTO wear_history
                (
                    item_id,
                    wear_date,
                    rating,
                    notes
                )
             VALUES
                (
                    $1,
                    $2::date,
                    $3,
                    $4
                )
             RETURNING
                wear_id,
                item_id,
                wear_date::text AS wear_date,
                rating,
                notes`,
            [
                item_id,
                wear_date,
                rating || null,
                notes || null
            ]
        );


        res.status(201).json({
            message: "Wear history added successfully.",
            wearHistory: result.rows[0]
        });


    } catch (error) {

        console.error(
            "Create wear history error:",
            error
        );


        res.status(500).json({
            error: "Failed to add wear history."
        });

    }
}



// =====================================================
// GET ALL WEAR HISTORY
// =====================================================

async function getAllWearHistory(req, res) {
    try {

        const userId =
            req.user.user_id;


        const result = await pool.query(
            `SELECT
                wh.wear_id,
                wh.item_id,

                -- Return DATE as plain YYYY-MM-DD text
                wh.wear_date::text AS wear_date,

                wh.rating,
                wh.notes,

                c.name,
                c.category,
                c.colour,
                c.image

             FROM wear_history wh

             INNER JOIN clothing c
                ON wh.item_id = c.item_id

             WHERE c.user_id = $1

             ORDER BY
                wh.wear_date DESC,
                wh.wear_id DESC`,
            [
                userId
            ]
        );


        res.status(200).json(
            result.rows
        );


    } catch (error) {

        console.error(
            "Get wear history error:",
            error
        );


        res.status(500).json({
            error: "Failed to fetch wear history."
        });

    }
}



// =====================================================
// GET ONE WEAR HISTORY RECORD
// =====================================================

async function getWearHistoryById(req, res) {
    try {

        const userId =
            req.user.user_id;

        const {
            wear_id
        } = req.params;


        const result = await pool.query(
            `SELECT
                wh.wear_id,
                wh.item_id,

                -- Return DATE as plain YYYY-MM-DD text
                wh.wear_date::text AS wear_date,

                wh.rating,
                wh.notes,

                c.name,
                c.category,
                c.colour,
                c.image

             FROM wear_history wh

             INNER JOIN clothing c
                ON wh.item_id = c.item_id

             WHERE wh.wear_id = $1
               AND c.user_id = $2`,
            [
                wear_id,
                userId
            ]
        );


        if (result.rows.length === 0) {

            return res.status(404).json({
                error:
                    "Wear history record not found."
            });

        }


        res.status(200).json(
            result.rows[0]
        );


    } catch (error) {

        console.error(
            "Get wear history by ID error:",
            error
        );


        res.status(500).json({
            error:
                "Failed to fetch wear history record."
        });

    }
}



// =====================================================
// UPDATE WEAR HISTORY
// =====================================================

async function updateWearHistory(req, res) {
    try {

        const userId =
            req.user.user_id;

        const {
            wear_id
        } = req.params;

        const {
            item_id,
            wear_date,
            rating,
            notes
        } = req.body;


        if (!item_id || !wear_date) {

            return res.status(400).json({
                error:
                    "Item and wear date are required."
            });

        }


        // Check that the new clothing item
        // belongs to the logged-in user
        const itemCheck = await pool.query(
            `SELECT item_id
             FROM clothing
             WHERE item_id = $1
               AND user_id = $2`,
            [
                item_id,
                userId
            ]
        );


        if (itemCheck.rows.length === 0) {

            return res.status(404).json({
                error:
                    "Clothing item not found."
            });

        }


        const result = await pool.query(
            `UPDATE wear_history wh

             SET
                item_id = $1,
                wear_date = $2::date,
                rating = $3,
                notes = $4

             FROM clothing c

             WHERE wh.wear_id = $5
               AND wh.item_id = c.item_id
               AND c.user_id = $6

             RETURNING
                wh.wear_id,
                wh.item_id,
                wh.wear_date::text AS wear_date,
                wh.rating,
                wh.notes`,
            [
                item_id,
                wear_date,
                rating || null,
                notes || null,
                wear_id,
                userId
            ]
        );


        if (result.rows.length === 0) {

            return res.status(404).json({
                error:
                    "Wear history record not found."
            });

        }


        res.status(200).json({
            message:
                "Wear history updated successfully.",

            wearHistory:
                result.rows[0]
        });


    } catch (error) {

        console.error(
            "Update wear history error:",
            error
        );


        res.status(500).json({
            error:
                "Failed to update wear history."
        });

    }
}



// =====================================================
// DELETE WEAR HISTORY
// =====================================================

async function deleteWearHistory(req, res) {
    try {

        const userId =
            req.user.user_id;

        const {
            wear_id
        } = req.params;


        const result = await pool.query(
            `DELETE FROM wear_history wh

             USING clothing c

             WHERE wh.wear_id = $1
               AND wh.item_id = c.item_id
               AND c.user_id = $2

             RETURNING
                wh.wear_id,
                wh.item_id,
                wh.wear_date::text AS wear_date,
                wh.rating,
                wh.notes`,
            [
                wear_id,
                userId
            ]
        );


        if (result.rows.length === 0) {

            return res.status(404).json({
                error:
                    "Wear history record not found."
            });

        }


        res.status(200).json({
            message:
                "Wear history deleted successfully.",

            wearHistory:
                result.rows[0]
        });


    } catch (error) {

        console.error(
            "Delete wear history error:",
            error
        );


        res.status(500).json({
            error:
                "Failed to delete wear history."
        });

    }
}



// =====================================================
// EXPORTS
// =====================================================

module.exports = {

    createWearHistory,

    getAllWearHistory,

    getWearHistoryById,

    updateWearHistory,

    deleteWearHistory

};