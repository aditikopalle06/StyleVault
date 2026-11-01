// src/controllers/profileController.js

const pool = require("../config/db");


// =====================================================
// GET PROFILE
// =====================================================

async function getProfile(req, res) {

    try {

        const userId = req.user.user_id;


        const result = await pool.query(

            `SELECT
                user_id,
                username,
                name,
                email,
                created_at
             FROM users
             WHERE user_id = $1`,

            [userId]

        );


        if (result.rows.length === 0) {

            return res.status(404).json({

                error: "User not found."

            });

        }


        return res.status(200).json({

            user: result.rows[0]

        });


    } catch (error) {

        console.error(
            "Error in getProfile():",
            error
        );


        return res.status(500).json({

            error: "Internal server error."

        });

    }

}



// =====================================================
// UPDATE PROFILE
// =====================================================

async function updateProfile(req, res) {

    try {

        const userId = req.user.user_id;


        const {
            name,
            username,
            email
        } = req.body;


        // ---------------------------------------------
        // BASIC VALIDATION
        // ---------------------------------------------

        if (
            !name ||
            !name.trim() ||
            !username ||
            !username.trim() ||
            !email ||
            !email.trim()
        ) {

            return res.status(400).json({

                error:
                    "Name, username and email are required."

            });

        }


        const cleanName =
            name.trim();

        const cleanUsername =
            username.trim();

        const cleanEmail =
            email.trim();


        // ---------------------------------------------
        // CHECK USERNAME
        // ---------------------------------------------

        const existingUsername =
            await pool.query(

                `SELECT user_id
                 FROM users
                 WHERE username = $1
                 AND user_id <> $2`,

                [
                    cleanUsername,
                    userId
                ]

            );


        if (existingUsername.rows.length > 0) {

            return res.status(409).json({

                error:
                    "Username is already taken."

            });

        }


        // ---------------------------------------------
        // CHECK EMAIL
        // ---------------------------------------------

        const existingEmail =
            await pool.query(

                `SELECT user_id
                 FROM users
                 WHERE email = $1
                 AND user_id <> $2`,

                [
                    cleanEmail,
                    userId
                ]

            );


        if (existingEmail.rows.length > 0) {

            return res.status(409).json({

                error:
                    "Email is already registered."

            });

        }


        // ---------------------------------------------
        // UPDATE USER
        // ---------------------------------------------

        const result =
            await pool.query(

                `UPDATE users
                 SET
                    name = $1,
                    username = $2,
                    email = $3
                 WHERE user_id = $4
                 RETURNING
                    user_id,
                    username,
                    name,
                    email,
                    created_at`,

                [
                    cleanName,
                    cleanUsername,
                    cleanEmail,
                    userId
                ]

            );


        if (result.rows.length === 0) {

            return res.status(404).json({

                error: "User not found."

            });

        }


        return res.status(200).json({

            message:
                "Profile updated successfully.",

            user:
                result.rows[0]

        });


    } catch (error) {

        console.error(
            "Error in updateProfile():",
            error
        );


        return res.status(500).json({

            error:
                "Internal server error."

        });

    }

}



module.exports = {

    getProfile,
    updateProfile

};