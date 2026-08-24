require('dotenv').config();

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/katalyst',
  jwtSecret: process.env.JWT_SECRET || 'supersecretjwtkey_katalyst_2026_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',

  // AI gateway (backend/api is the only thing allowed to call into /ai — see
  // services/ai/aiClientBridge.js and routes/aiRoutes.js).
  geminiApiKey: process.env.GEMINI_API_KEY || null,
  // Shared secret required (in addition to admin JWT) to call internal,
  // non-client-facing AI routes such as judge scoring. Must be set in
  // production — there is no safe default, unlike jwtSecret above.
  internalAiKey: process.env.INTERNAL_AI_KEY || null,

  // Password reset email delivery (services/emailService.js). Leave
  // resendApiKey unset to disable real sending - forgot-password then
  // responds with the reset link directly instead of emailing it (fine for
  // local dev, never for production).
  resendApiKey: process.env.RESEND_API_KEY || null,
  resendFromEmail: process.env.RESEND_FROM_EMAIL || 'Katalyst <onboarding@resend.dev>',
  frontendUrl: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000'
};

module.exports = config;
