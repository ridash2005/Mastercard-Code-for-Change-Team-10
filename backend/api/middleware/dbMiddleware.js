const mongoose = require('mongoose');

const isDatabaseAvailable = () => mongoose.connection.readyState === 1;

// For routes with no auth gate in front of them (or gated by `optionalAuth`,
// which never blocks a request) but whose controller still needs Mongo -
// e.g. public catalog listings, register/login, the public contact form.
// Without this, a request made while Mongo is unreachable doesn't fail
// fast: it sits on Mongoose's command buffer for its full bufferTimeoutMS
// (10s by default) before erroring out. See middleware/authMiddleware.js
// for the equivalent check on `authenticate`-gated routes.
const requireDatabase = (req, res, next) => {
  if (!isDatabaseAvailable()) {
    return res.status(503).json({
      success: false,
      message: 'Database is currently unavailable. Please try again shortly.'
    });
  }
  next();
};

module.exports = { requireDatabase, isDatabaseAvailable };
