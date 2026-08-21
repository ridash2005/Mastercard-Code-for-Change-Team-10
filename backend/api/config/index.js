require('dotenv').config();

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/katalyst',
  jwtSecret: process.env.JWT_SECRET || 'supersecretjwtkey_katalyst_2026_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',

  // AI gateway (backend-1 is the only thing allowed to call into /ai — see
  // services/ai/aiClientBridge.js and routes/aiRoutes.js).
  geminiApiKey: process.env.GEMINI_API_KEY || null,
  // Shared secret required (in addition to admin JWT) to call internal,
  // non-client-facing AI routes such as judge scoring. Must be set in
  // production — there is no safe default, unlike jwtSecret above.
  internalAiKey: process.env.INTERNAL_AI_KEY || null
};

module.exports = config;
