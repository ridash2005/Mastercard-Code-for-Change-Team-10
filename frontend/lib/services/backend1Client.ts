// Server-only bridge to backend-1 (the real backend). Never import this from
// a "use client" component — it holds no secrets a browser should see, but
// the JWTs it manages are meant to stay server-side, proxied through this
// app's own /api/* route handlers rather than exposed to the browser.
//
// This is intentionally scoped to the AI Coach path only (KATALYST_AI_SPEC.md
// §3), matching the demo's mock-account model: the frontend has no real
// registration/login UI wired to backend-1 yet (see README's "Monorepo
// status"), so this transparently provisions/logs in a shadow backend-1
// account per demo user email, using a fixed demo password. That's fine for
// a hackathon demo bridge — swap for backend-1's real login flow once the
// frontend has one.

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
    throw new BackendUnavailableError(`backend-1 is unreachable at ${BACKEND_API_URL}`, err);
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
const TOKEN_TTL_MS = 6 * 24 * 60 * 60 * 1000; // under backend-1's 7d JWT_EXPIRES_IN

/** Drops a cached token — call this when backend-1 rejects it (401), e.g.
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
  if (!token) throw new BackendUnavailableError("Could not authenticate the demo bridge account with backend-1");

  tokenCache.set(email, { token, expiresAt: Date.now() + TOKEN_TTL_MS });
  return token;
}

export type CoachMessageResult =
  | { ok: true; reply: string; intent: string }
  | { ok: false; status: number; reason?: string; message: string };

/**
 * Calls backend-1's guarded AI Coach endpoint (POST /api/ai/coach/message).
 * This is the ONLY function in the frontend that talks to the AI gateway —
 * everything else (guardrails, rate limiting, the actual LLM call) lives in
 * backend-1 per the auth/routing rules in KATALYST_AI_SPEC.md.
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
