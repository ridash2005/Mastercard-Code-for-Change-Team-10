// Shared cookie config for the real backend/api session token. Kept in one
// place so every route handler that sets/reads it agrees on the name and
// options - see app/api/auth/{register,login,logout,me}/route.ts.

export const AUTH_COOKIE_NAME = "katalyst_token";

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7 // 7d, matches backend/api's default JWT_EXPIRES_IN
};
