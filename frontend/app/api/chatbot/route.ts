// The general Chatbot's real path: browser -> this route -> backend/api's
// guarded /api/ai/chatbot/message (JWT auth, rate limiting, guardrails,
// Gemini) -> real actions (enroll, submit feedback, reschedule, draft a
// course, ...) via services/chatbotActionService.js.
//
// Deliberately DIFFERENT from app/api/coach/route.ts's pattern: the Coach
// uses a demo-bridge shadow account (see lib/services/backendClient.ts)
// because it predates real frontend auth. The chatbot can perform real
// writes against the caller's OWN data (their enrollments, their
// notifications, ...), so it must use the real session cookie set by
// app/api/auth/{login,register}/route.ts - a shadow account would act on
// a different, disconnected user than the one actually signed in.

import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/cookies";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:5000/api";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ success: false, message: "Sign in to use the chatbot.", offline: false }, { status: 401 });
  }

  let payload: { message?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof payload.message !== "string" || !payload.message.trim()) {
    return NextResponse.json({ success: false, message: "message is required" }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${BACKEND_API_URL}/ai/chatbot/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: payload.message }),
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "The backend is currently unreachable.", offline: true },
      { status: 503 },
    );
  }

  const body = await res.json().catch(() => ({}));
  return NextResponse.json(body, { status: res.status });
}
