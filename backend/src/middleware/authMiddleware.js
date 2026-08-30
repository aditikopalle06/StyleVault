// src/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

/**
 * Express middleware that protects routes by requiring a valid JWT.
 *
 * Expected header format:
 *   Authorization: Bearer <token>
 *
 * On success: attaches the decoded token payload to req.user and
 * calls next() so the route handler runs.
 *
 * On failure: sends a 401 response and does NOT call next() —
 * the request stops here and never reaches the protected route.
 */
function authenticateToken(req, res, next) {
  // ---------------------------------------------------------
  // 1. Read the Authorization header
  // ---------------------------------------------------------
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header is missing.' });
  }

  // ---------------------------------------------------------
  // 2. Validate the "Bearer <token>" format
  //    Splitting on space should give exactly two parts:
  //    ["Bearer", "<token>"]
  // ---------------------------------------------------------
  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      error: 'Authorization header must be in the format: Bearer <token>',
    });
  }

  const token = parts[1];

  // ---------------------------------------------------------
  // 3. Verify the token using the same secret it was signed with
  // ---------------------------------------------------------
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      // This covers both an invalid signature/malformed token AND
      // an expired token (jwt.verify treats both as errors, but
      // gives err.name = 'TokenExpiredError' specifically for expiry).
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token has expired.' });
      }
      return res.status(403).json({ error: 'Invalid token.' });
    }

    // ---------------------------------------------------------
    // 4. Attach the decoded payload (user_id, username, email)
    //    to req.user so later route handlers can use it.
    // ---------------------------------------------------------
    req.user = decoded;

    // ---------------------------------------------------------
    // 5. Authentication succeeded — continue to the route handler.
    // ---------------------------------------------------------
    next();
  });
}

module.exports = authenticateToken;