// Defense-in-depth gate for AI routes that must never be client-facing
// (KATALYST_AI_SPEC.md §2.1: the AI Judge is triggered by a backend job/event,
// not by a user clicking something in a browser). A valid admin JWT alone is
// not enough here - the caller must also present a shared secret that only
// trusted server-side callers (an internal job runner, an admin CLI script)
// know. A stolen/leaked admin browser session cannot trigger scoring on its
// own.

const config = require('../config');

function requireInternalServiceKey(req, res, next) {
  const providedKey = req.headers['x-internal-ai-key'];

  if (!config.internalAiKey) {
    return res.status(503).json({
      success: false,
      message: 'INTERNAL_AI_KEY is not configured on this server - internal AI routes are disabled.'
    });
  }

  if (!providedKey || providedKey !== config.internalAiKey) {
    return res.status(403).json({
      success: false,
      message: 'This endpoint is internal-only and requires a valid service key.'
    });
  }

  next();
}

module.exports = { requireInternalServiceKey };
