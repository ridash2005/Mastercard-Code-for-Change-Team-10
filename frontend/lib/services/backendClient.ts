// Server-only bridge to backend/api (the real backend). Never import this from
// a "use client" component — it holds no secrets a browser should see, but
// the JWTs it manages are meant to stay server-side, proxied through this
// app's own /api/* route handlers rather than exposed to the browser.
//
// Two auth paths live here:
//   - registerRealUser/loginRealUser/getMe: the real path, used by
//     app/api/auth/{register,login,me}/route.ts for actual sign-up/sign-in -
//     the user's own password, checked by backend/api's bcrypt+JWT.
//   - getBackendToken (login/registerAndLogin below): a demo-bridge that
//     transparently provisions/logs in a shadow backend/api account per
//     user email with a fixed demo password (KATALYST_AI_SPEC.md §3), used
//     ONLY by the AI Coach route (app/api/coach/route.ts). It predates real
//     auth and stayed scoped to Coach rather than being ripped out, since
//     other routes (app/api/backend/[...path]/route.ts,
//     app/api/chatbot/route.ts) now read the real session cookie directly
//     instead of needing this bridge.

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:5000/api";
const DEMO_PASSWORD = process.env.BACKEND_DEMO_PASSWORD ?? "katalyst-demo-bridge-2026";

type BackendResponse<T> = { status: number; body: T | null };

async function backendFetch<T = unknown>(path: string, init: RequestInit): Promise<BackendResponse<T>> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND_API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init.headers ?? {}) }
    });
  } catch (err) {
    throw new BackendUnavailableError(`backend/api is unreachable at ${BACKEND_API_URL}`, err);
  }

  let body: T | null = null;
  try {
    body = (await res.json()) as T;
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

export class BackendUnavailableError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "BackendUnavailableError";
  }
}

type AuthResponse = { success: boolean; data?: { token: string } };

async function login(email: string): Promise<string | null> {
  const { status, body } = await backendFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: DEMO_PASSWORD })
  });
  if (status === 200 && body?.success && body.data?.token) return body.data.token;
  return null;
}

async function registerAndLogin(email: string, name: string, role: "student" | "admin"): Promise<string | null> {
  await backendFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password: DEMO_PASSWORD, role })
  });
  // Registration also returns a token, but re-login keeps this one code path
  // (and its error handling) for both the "already exists" and "just made
  // it" cases.
  return login(email);
}

// In-memory per-process token cache — fine for a single dev-server instance;
// a multi-instance deployment would want Redis (per KATALYST_BACKEND_SPEC.md
// §1's cache layer) instead.
const tokenCache = new Map<string, { token: string; expiresAt: number }>();
const TOKEN_TTL_MS = 6 * 24 * 60 * 60 * 1000; // under backend/api's 7d JWT_EXPIRES_IN

/** Drops a cached token — call this when backend/api rejects it (401), e.g.
 * after a backend restart invalidates the user id a cached JWT points at. */
export function invalidateBackendToken(email: string): void {
  tokenCache.delete(email);
}

export async function getBackendToken(
  email: string,
  name: string,
  role: "student" | "admin",
  forceRefresh = false
): Promise<string> {
  const cached = !forceRefresh && tokenCache.get(email);
  if (cached && cached.expiresAt > Date.now()) return cached.token;

  let token = await login(email);
  if (!token) token = await registerAndLogin(email, name, role);
  if (!token) throw new BackendUnavailableError("Could not authenticate the demo bridge account with backend/api");

  tokenCache.set(email, { token, expiresAt: Date.now() + TOKEN_TTL_MS });
  return token;
}

export type BackendUser = {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
  college?: string;
  programme?: string;
  avatar?: string;
  onboardingCompleted?: boolean;
};

export type AuthResult =
  | { ok: true; token: string; user: BackendUser }
  | { ok: false; status: number; message: string };

/**
 * Real registration against backend/api - the user's own password, not the
 * AI Coach demo bridge's fixed password. This is the actual auth path once
 * the frontend has real login/register UI (see app/api/auth/*).
 */
export async function registerRealUser(input: {
  name: string;
  email: string;
  password: string;
  role: "student" | "admin";
  college?: string;
  programme?: string;
}): Promise<AuthResult> {
  const { status, body } = await backendFetch<{
    success: boolean;
    message?: string;
    data?: { token: string; user: BackendUser };
  }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input)
  });

  if (status === 201 && body?.success && body.data) {
    return { ok: true, token: body.data.token, user: body.data.user };
  }
  return { ok: false, status, message: body?.message ?? "Registration failed" };
}

/** Real login against backend/api with a user-supplied password. */
export async function loginRealUser(email: string, password: string): Promise<AuthResult> {
  const { status, body } = await backendFetch<{
    success: boolean;
    message?: string;
    data?: { token: string; user: BackendUser };
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

  if (status === 200 && body?.success && body.data) {
    return { ok: true, token: body.data.token, user: body.data.user };
  }
  return { ok: false, status, message: body?.message ?? "Invalid email or password" };
}

/**
 * Trades a one-time OAuth login code (from the Google/GitHub callback
 * redirect, see app/auth/callback/page.tsx) for the real session JWT.
 * Server-to-server only - the code itself is single-use and short-lived,
 * but this still never runs in the browser (matches every other real-auth
 * function in this file).
 */
export async function exchangeOAuthCode(code: string): Promise<AuthResult> {
  const { status, body } = await backendFetch<{
    success: boolean;
    message?: string;
    data?: { token: string; user: BackendUser };
  }>("/auth/oauth/exchange", {
    method: "POST",
    body: JSON.stringify({ code })
  });

  if (status === 200 && body?.success && body.data) {
    return { ok: true, token: body.data.token, user: body.data.user };
  }
  return { ok: false, status, message: body?.message ?? "Could not complete sign-in" };
}

/** Fetches the current user for a real backend/api JWT (from the session cookie). */
export async function getMe(token: string): Promise<BackendUser | null> {
  const { status, body } = await backendFetch<{ success: boolean; data?: { user: BackendUser } }>("/auth/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (status === 200 && body?.success && body.data) return body.data.user;
  return null;
}

export type CoachMessageResult =
  | { ok: true; reply: string; intent: string }
  | { ok: false; status: number; reason?: string; message: string };

/**
 * Calls backend/api's guarded AI Coach endpoint (POST /api/ai/coach/message).
 * This is the ONLY function in the frontend that talks to the AI gateway —
 * everything else (guardrails, rate limiting, the actual LLM call) lives in
 * backend/api per the auth/routing rules in KATALYST_AI_SPEC.md.
 */
export async function callCoachMessage(token: string, message: string): Promise<CoachMessageResult> {
  const { status, body } = await backendFetch<{
    success: boolean;
    data?: { reply: string; intent: string };
    message?: string;
    reason?: string;
  }>("/ai/coach/message", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message })
  });

  if (status === 200 && body?.success && body.data) {
    return { ok: true, reply: body.data.reply, intent: body.data.intent };
  }

  return {
    ok: false,
    status,
    reason: body?.reason,
    message: body?.message ?? "AI Coach request failed"
  };
}
