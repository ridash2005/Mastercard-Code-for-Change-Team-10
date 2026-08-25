const mongoose = require('mongoose');

// A short-lived, single-use code handed to the frontend via the OAuth
// callback redirect (?code=...), exchanged server-to-server for the real
// session JWT by app/api/auth/oauth-exchange/route.ts -> POST
// /api/auth/oauth/exchange. Never put the actual JWT in a redirect URL
// (browser history, referrer headers, server logs) - same principle as
// PasswordResetToken: only the SHA-256 hash of the code is stored.
const oauthLoginCodeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    codeHash: {
      type: String,
      required: true,
      unique: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    used: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

oauthLoginCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OAuthLoginCode =
  mongoose.models.OAuthLoginCode || mongoose.model('OAuthLoginCode', oauthLoginCodeSchema);

module.exports = OAuthLoginCode;
