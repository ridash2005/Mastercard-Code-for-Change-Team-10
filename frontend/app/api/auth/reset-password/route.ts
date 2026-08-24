// Real password reset completion: browser -> this route -> backend/api's
// real POST /api/auth/reset-password (validates the token, re-hashes the
// new password via User's pre-save hook).

import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:5000/api";

export async function POST(req: NextRequest) {
  let payload: { token?: unknown; password?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof payload.token !== "string" || !payload.token) {
    return NextResponse.json({ success: false, message: "token is required" }, { status: 400 });
  }
  if (typeof payload.password !== "string" || payload.password.length < 6) {
    return NextResponse.json({ success: false, message: "password must be at least 6 characters" }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${BACKEND_API_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: payload.token, password: payload.password }),
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "The backend is currently unreachable." },
      { status: 502 },
    );
  }

  const body = await res.json().catch(() => ({}));
  return NextResponse.json(body, { status: res.status });
}
