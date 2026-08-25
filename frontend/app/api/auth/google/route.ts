// "Continue with Google" button target. A plain browser navigation (not
// fetch), so it can follow the full redirect chain: this route -> backend/
// api's /auth/google -> Google's consent screen -> backend/api's
// /auth/google/callback -> ${FRONTEND_URL}/auth/callback?code=... . Kept as
// a thin redirect (rather than the button linking straight at backend/api)
// so BACKEND_API_URL stays a server-only secret, consistent with every
// other backend/api call in this app - see lib/services/backendClient.ts.

import { NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:5000/api";

export async function GET() {
  return NextResponse.redirect(`${BACKEND_API_URL}/auth/google`);
}
