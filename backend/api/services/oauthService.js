// OAuth protocol plumbing only - talks to Google's/GitHub's OAuth endpoints
// directly over fetch (no passport/OAuth library dependency needed for a
// plain authorization-code flow). Account creation/lookup lives in
// authService.js's findOrCreateOAuthUser; this module never touches Mongo.
const config = require('../config');

const GOOGLE_REDIRECT_URI = () => `${config.backendPublicUrl}/api/auth/google/callback`;
const GITHUB_REDIRECT_URI = () => `${config.backendPublicUrl}/api/auth/github/callback`;

function getGoogleAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: config.googleClientId,
    redirect_uri: GOOGLE_REDIRECT_URI(),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account'
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/** @returns {Promise<{ id: string, email: string|null, name: string, picture: string|null }>} */
async function exchangeGoogleCode(code) {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      redirect_uri: GOOGLE_REDIRECT_URI(),
      grant_type: 'authorization_code'
    })
  });
  const tokenBody = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !tokenBody.access_token) {
    throw new Error(`Google token exchange failed: ${tokenBody.error_description || tokenBody.error || tokenRes.status}`);
  }

  const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokenBody.access_token}` }
  });
  const profile = await profileRes.json().catch(() => ({}));
  if (!profileRes.ok || !profile.sub) {
    throw new Error('Failed to fetch Google profile');
  }

  return {
    id: profile.sub,
    email: profile.email || null,
    name: profile.name || profile.email || 'Google User',
    picture: profile.picture || null
  };
}

function getGithubAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: config.githubClientId,
    redirect_uri: GITHUB_REDIRECT_URI(),
    // user:email - GitHub's own /user response omits email entirely when
    // the account has no public email set, so this is needed to fall back
    // to /user/emails below.
    scope: 'read:user user:email',
    state
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/** @returns {Promise<{ id: string, email: string|null, name: string, picture: string|null }>} */
async function exchangeGithubCode(code) {
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      code,
      client_id: config.githubClientId,
      client_secret: config.githubClientSecret,
      redirect_uri: GITHUB_REDIRECT_URI()
    })
  });
  const tokenBody = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !tokenBody.access_token) {
    throw new Error(`GitHub token exchange failed: ${tokenBody.error_description || tokenBody.error || tokenRes.status}`);
  }

  const headers = { Authorization: `Bearer ${tokenBody.access_token}`, 'User-Agent': 'katalyst-backend' };
  const profileRes = await fetch('https://api.github.com/user', { headers });
  const profile = await profileRes.json().catch(() => ({}));
  if (!profileRes.ok || !profile.id) {
    throw new Error('Failed to fetch GitHub profile');
  }

  let email = profile.email || null;
  if (!email) {
    const emailsRes = await fetch('https://api.github.com/user/emails', { headers });
    if (emailsRes.ok) {
      const emails = await emailsRes.json().catch(() => []);
      const match = emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified);
      email = match ? match.email : null;
    }
  }

  return {
    id: String(profile.id),
    email,
    name: profile.name || profile.login || 'GitHub User',
    picture: profile.avatar_url || null
  };
}

module.exports = { getGoogleAuthUrl, exchangeGoogleCode, getGithubAuthUrl, exchangeGithubCode };
