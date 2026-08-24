// Real password reset request: browser -> this route -> backend/api's real
// POST /api/auth/forgot-password (generates a token, emails a reset link
// via Resend - see backend/api/services/emailService.js). Never reveals
// whether the email matches an account.

import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:5000/api";

export async function POST(req: NextRequest) {
  let payload: { email?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof payload.email !== "string" || !payload.email.trim()) {
    return NextResponse.json({ success: false, message: "email is required" }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${BACKEND_API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: payload.email }),
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
