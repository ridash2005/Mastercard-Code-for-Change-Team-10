const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const { isDatabaseAvailable } = require('./dbMiddleware');

const authenticate = async (req, res, next) => {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    });
  }

  // Checked after the token-presence check (so a request with no token at
  // all still gets a fast, honest 401 regardless of DB state) but before
  // the DB lookup below (so a request with a token fails fast with a 503
  // instead of hanging on Mongoose's command buffer for its full timeout).
  if (!isDatabaseAvailable()) {
    return res.status(503).json({
      success: false,
      message: 'Database is currently unavailable. Please try again shortly.'
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message
    });
  }
};

const optionalAuth = async (req, res, next) => {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (user) {
      req.user = user;
    }
  } catch (err) {
    // Optional auth ignores invalid tokens and proceeds unauthenticated
  }

  next();
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized to access this resource.`
      });
    }

    next();
  };
};

module.exports = { authenticate, optionalAuth, authorize };
