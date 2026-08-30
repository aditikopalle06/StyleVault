// src/controllers/authController.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // <-- ADDED for login
const pool = require('../config/db');

// Number of salt rounds for bcrypt. 10 is a standard, safe default.
const SALT_ROUNDS = 10;

/**
 * POST /api/auth/register
 * Creates a new user account.
 * (Unchanged from before.)
 */
async function register(req, res) {
  try {
    const { username, name, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'username, email and password are required.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long.',
      });
    }

    const displayName = name && name.trim() !== '' ? name : username;

    const existingUsername = await pool.query(
      'SELECT user_id FROM users WHERE username = $1',
      [username]
    );

    if (existingUsername.rows.length > 0) {
      return res.status(409).json({ error: 'Username is already taken.' });
    }

    const existingEmail = await pool.query(
      'SELECT user_id FROM users WHERE email = $1',
      [email]
    );

    if (existingEmail.rows.length > 0) {
      return res.status(409).json({ error: 'Email is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const insertResult = await pool.query(
      `INSERT INTO users (username, name, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, username, name, email`,
      [username, displayName, email, passwordHash]
    );

    const newUser = insertResult.rows[0];

    return res.status(201).json({
      message: 'User registered successfully.',
      user: newUser,
    });
  } catch (error) {
    console.error('Error in register():', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * POST /api/auth/login
 * Logs a user in using either their username or email, plus password.
 * On success, returns a signed JWT the frontend can store and send
 * back on future requests (e.g. in an Authorization header).
 * (New.)
 */
async function login(req, res) {
  try {
    const { username, email, password } = req.body;

    // Caller must supply a password AND at least one of username / email.
    if (!password || (!username && !email)) {
      return res.status(400).json({
        error: 'Provide a password and either a username or email.',
      });
    }

    // Look up the user by whichever identifier was given.
    // We select password_hash here (needed for bcrypt.compare)
    // but never send it back in a response.
    const identifier = username || email;

    const result = await pool.query(
      `SELECT user_id, username, name, email, password_hash
       FROM users
       WHERE username = $1 OR email = $1`,
      [identifier]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = result.rows[0];

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    // Password is correct — issue a JWT. Payload keeps only
    // non-sensitive identifying info. JWT_SECRET comes from .env.
    const token = jwt.sign(
      {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    // Respond — password_hash is left out on purpose.
    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error in login():', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { register, login }; // <-- CHANGED: added login