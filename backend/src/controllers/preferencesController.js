// src/controllers/preferencesController.js

const pool = require('../config/db');

/**
 * GET /api/preferences
 * Returns the logged-in user's preferences row.
 * 404 if the user hasn't saved preferences yet.
 */
async function getPreferences(req, res) {
  try {
    const userId = req.user.user_id;

    const result = await pool.query(
      `SELECT preference_id, user_id, preferred_styles, preferred_colours,
              preferred_occasions, preferred_seasons, preferred_fit, additional_preferences
       FROM user_preferences
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No preferences found for this user.' });
    }

    return res.status(200).json({ preferences: result.rows[0] });
  } catch (error) {
    console.error('Error in getPreferences():', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * PUT /api/preferences  (or POST — either works, see routes explanation)
 * Creates the logged-in user's preferences row if none exists yet,
 * or updates the existing one — same endpoint handles both cases.
 */
async function savePreferences(req, res) {
  try {
    const userId = req.user.user_id;
    const {
      preferred_styles,
      preferred_colours,
      preferred_occasions,
      preferred_seasons,
      preferred_fit,
      additional_preferences,
    } = req.body;

    // Arrays are optional — default to an empty array rather than
    // NULL so ANY()/&& queries elsewhere behave predictably.
    const result = await pool.query(
      `INSERT INTO user_preferences
        (user_id, preferred_styles, preferred_colours, preferred_occasions,
         preferred_seasons, preferred_fit, additional_preferences)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id) DO UPDATE
         SET preferred_styles = EXCLUDED.preferred_styles,
             preferred_colours = EXCLUDED.preferred_colours,
             preferred_occasions = EXCLUDED.preferred_occasions,
             preferred_seasons = EXCLUDED.preferred_seasons,
             preferred_fit = EXCLUDED.preferred_fit,
             additional_preferences = EXCLUDED.additional_preferences,
             updated_at = now()
       RETURNING *`,
      [
        userId,
        preferred_styles || [],
        preferred_colours || [],
        preferred_occasions || [],
        preferred_seasons || [],
        preferred_fit || null,
        additional_preferences || null,
      ]
    );

    return res.status(200).json({
      message: 'Preferences saved successfully.',
      preferences: result.rows[0],
    });
  } catch (error) {
    console.error('Error in savePreferences():', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { getPreferences, savePreferences };