// Real onboarding completion: browser -> this route -> backend/api's real
// POST /api/auth/onboarding (marks the user's onboardingCompleted/profile
// onboarded flags, saves interests/skills/careerGoal). Mirrors the
// app/api/auth/* pattern - the session's JWT is read from the httpOnly
// cookie server-side and forwarded as a Bearer token.

import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/cookies";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:5000/api";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ success: false, message: "Not signed in" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${BACKEND_API_URL}/auth/onboarding`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "backend/api is unreachable. Is it running?" },
      { status: 502 }
    );
  }

  const body = await res.json().catch(() => ({}));
  return NextResponse.json(body, { status: res.status });
}
