const mongoose = require('mongoose');

// Every route except /api/health needs Mongo (auth alone does a DB lookup on
// every authenticated request - see middleware/authMiddleware.js). Without
// this guard, a request made while Mongo is unreachable doesn't fail fast:
// it sits on Mongoose's command buffer for its full bufferTimeoutMS (10s by
// default) before erroring out. Checking the connection state up front turns
// that into an instant, honest 503 instead.
const requireDatabase = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database is currently unavailable. Please try again shortly.'
    });
  }
  next();
};

module.exports = { requireDatabase };
