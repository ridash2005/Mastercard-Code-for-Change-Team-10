// "Sign in with Google/GitHub" - the redirect-initiate and callback legs of
// a plain OAuth 2.0 authorization-code flow. Protocol calls to the
// providers live in services/oauthService.js; account creation/lookup and
// the one-time login-code handoff live in services/authService.js.
//
// Flow: browser GET /api/auth/google -> redirect to Google -> user consents
// -> Google redirects back to GET /api/auth/google/callback?code=... ->
// this exchanges that for a profile, finds/creates the user, mints a
// short-lived one-time code, and redirects the browser to
// `${FRONTEND_URL}/auth/callback?code=...` - the frontend then POSTs that
// code to its own /api/auth/oauth-exchange route, which calls
// POST /api/auth/oauth/exchange (exchangeCode below) to trade it for the
// real session JWT server-to-server, and sets the httpOnly cookie exactly
// like a normal login. The real JWT never appears in a URL.
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');
const oauthService = require('../services/oauthService');
const authService = require('../services/authService');

// A signed, short-lived JWT used as CSRF state - no DB round trip needed to
// issue or verify it, unlike the login code above (which has to survive a
// lookup after the fact, so it's stored).
function signState() {
  return jwt.sign({ purpose: 'oauth_state', nonce: crypto.randomBytes(8).toString('hex') }, config.jwtSecret, {
    expiresIn: '10m'
  });
}

function isValidState(state) {
  if (!state) return false;
  try {
    const payload = jwt.verify(state, config.jwtSecret);
    return payload.purpose === 'oauth_state';
  } catch {
    return false;
  }
}

function redirectWithError(res, message) {
  res.redirect(`${config.frontendUrl}/login?oauthError=${encodeURIComponent(message)}`);
}

async function completeOAuthLogin(res, provider, profile) {
  const { user } = await authService.findOrCreateOAuthUser({
    provider,
    providerId: profile.id,
    email: profile.email,
    name: profile.name,
    avatarUrl: profile.picture
  });
  const loginCode = await authService.createOAuthLoginCode(user._id);
  res.redirect(`${config.frontendUrl}/auth/callback?code=${loginCode}`);
}

exports.googleRedirect = (req, res) => {
  if (!config.googleClientId || !config.googleClientSecret) {
    return res.status(503).json({ success: false, message: 'Google sign-in is not configured on this server.' });
  }
  res.redirect(oauthService.getGoogleAuthUrl(signState()));
};

exports.googleCallback = async (req, res) => {
  const { code, state, error } = req.query;

  if (error) return redirectWithError(res, 'Google sign-in was cancelled.');
  if (!code || !isValidState(state)) {
    return redirectWithError(res, 'That sign-in attempt is invalid or expired. Please try again.');
  }

  try {
    const profile = await oauthService.exchangeGoogleCode(code);
    await completeOAuthLogin(res, 'google', profile);
  } catch (err) {
    console.error('Google OAuth callback failed:', err);
    redirectWithError(res, err.message && err.statusCode ? err.message : 'Could not complete Google sign-in. Please try again.');
  }
};

exports.githubRedirect = (req, res) => {
  if (!config.githubClientId || !config.githubClientSecret) {
    return res.status(503).json({ success: false, message: 'GitHub sign-in is not configured on this server.' });
  }
  res.redirect(oauthService.getGithubAuthUrl(signState()));
};

exports.githubCallback = async (req, res) => {
  const { code, state, error } = req.query;

  if (error) return redirectWithError(res, 'GitHub sign-in was cancelled.');
  if (!code || !isValidState(state)) {
    return redirectWithError(res, 'That sign-in attempt is invalid or expired. Please try again.');
  }

  try {
    const profile = await oauthService.exchangeGithubCode(code);
    await completeOAuthLogin(res, 'github', profile);
  } catch (err) {
    console.error('GitHub OAuth callback failed:', err);
    redirectWithError(res, err.message && err.statusCode ? err.message : 'Could not complete GitHub sign-in. Please try again.');
  }
};

// @desc    Trade a one-time OAuth login code for the real session JWT
// @route   POST /api/auth/oauth/exchange
// @access  Public (the code itself is the credential, single-use, 2min TTL)
exports.exchangeCode = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, message: 'code is required' });
    }
    const result = await authService.exchangeOAuthLoginCode(code);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
