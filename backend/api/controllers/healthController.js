const { getDBStatus } = require('../config/db');
const config = require('../config');

// @desc    Check server & database health
// @route   GET /api/health
// @access  Public
const checkHealth = (req, res) => {
  const dbStatus = getDBStatus();

  res.status(200).json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'katalyst-backend-api',
    uptimeSeconds: Math.floor(process.uptime()),
    environment: config.nodeEnv,
    database: {
      status: dbStatus,
      connected: dbStatus === 'connected'
    }
  });
};

module.exports = {
  checkHealth
};
