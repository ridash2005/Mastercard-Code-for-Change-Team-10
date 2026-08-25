// Shared cookie config for the real backend/api session token. Kept in one
// place so every route handler that sets/reads it agrees on the name and
// options - see app/api/auth/{register,login,logout,me}/route.ts and
// app/api/backend/[...path]/route.ts.

import type { NextRequest, NextResponse } from "next/server";

export const AUTH_COOKIE_NAME = "katalyst_token";
export const ROLE_COOKIE_NAME = "katalyst-role";
export const USER_COOKIE_NAME = "katalyst-user";

// Sliding inactivity window: every authenticated request re-sets these
// cookies' maxAge back up to this (see touchSessionCookies below), so an
// active user's session keeps rolling forward. A refresh alone re-sends the
// cookies as-is (browsers persist a cookie with maxAge across reloads,
// unlike a maxAge-less session cookie), so the user stays signed in across
// reloads too - never merely logged out by reloading the page.
const SESSION_IDLE_MAX_AGE = 60 * 60; // 1h of inactivity

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_IDLE_MAX_AGE
};

// katalyst-role/katalyst-user aren't httpOnly (proxy.ts's route guard and
// some client code read them directly), but must expire in step with
// AUTH_COOKIE_OPTIONS above - otherwise the role cookie can outlive or fall
// short of the real session cookie, and proxy.ts bounces a still-logged-in
// user back to /login.
export const SESSION_MARKER_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  maxAge: SESSION_IDLE_MAX_AGE
};

/** Sets all three session cookies fresh - used right after login/register/OAuth. */
export function setSessionCookies(res: NextResponse, token: string, role: string, userId: string): void {
  res.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
  res.cookies.set(ROLE_COOKIE_NAME, role, SESSION_MARKER_COOKIE_OPTIONS);
  res.cookies.set(USER_COOKIE_NAME, userId, SESSION_MARKER_COOKIE_OPTIONS);
}

/** Clears all three session cookies - used on explicit logout and when
 * backend/api rejects the token (e.g. the absolute JWT_EXPIRES_IN cap hit,
 * see backend/api/config/index.js) so the client sees a clean logged-out
 * state instead of stale cookies. */
export function clearSessionCookies(res: NextResponse): void {
  res.cookies.set(AUTH_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  res.cookies.set(ROLE_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  res.cookies.set(USER_COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

/**
 * Sliding-session refresh: re-sets the session cookies already on `req`
 * onto `res` with their maxAge reset to SESSION_IDLE_MAX_AGE, so activity
 * (any authenticated call through app/api/backend/[...path]/route.ts or
 * app/api/auth/me/route.ts) keeps extending the idle window instead of the
 * session hard-expiring on a fixed clock. The backend JWT's own expiry
 * (config.jwtExpiresIn) is intentionally longer than this idle window - it
 * acts as an absolute cap independent of activity, so an eternally-active
 * session still re-authenticates eventually.
 *
 * No-ops (returns false) if there's no token cookie to slide - nothing to
 * extend for an already-logged-out request.
 */
export function touchSessionCookies(res: NextResponse, req: NextRequest): boolean {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return false;

  res.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);

  const role = req.cookies.get(ROLE_COOKIE_NAME)?.value;
  if (role) res.cookies.set(ROLE_COOKIE_NAME, role, SESSION_MARKER_COOKIE_OPTIONS);

  const userId = req.cookies.get(USER_COOKIE_NAME)?.value;
  if (userId) res.cookies.set(USER_COOKIE_NAME, userId, SESSION_MARKER_COOKIE_OPTIONS);

  return true;
}
