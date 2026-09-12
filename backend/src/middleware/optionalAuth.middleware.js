// src/middleware/optionalAuth.middleware.js
const jwt = require('jsonwebtoken');

const optionalAuthMiddleware = (req, res, next) => {
  // 1. Get token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Attach user data to request object
    req.user = decoded; // { id, email, role }
  } catch (error) {
    // Treat invalid or expired token as guest
    req.user = null;
  }
  next();
};

module.exports = optionalAuthMiddleware;
