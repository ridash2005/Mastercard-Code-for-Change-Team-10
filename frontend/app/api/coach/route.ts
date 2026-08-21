// The frontend's only path to the AI Coach: browser -> this route (Next.js
// server) -> backend-1 (/api/ai/coach/message, JWT-gated + guardrailed) ->
// ai/ai-client -> Gemini. The browser never talks to backend-1 or /ai
// directly, and this route holds no LLM/provider secrets of its own — it
// only forwards to backend-1, which owns auth and guardrails.

import { NextRequest, NextResponse } from "next/server";
import {
  BackendUnavailableError,
  callCoachMessage,
  getBackendToken,
  invalidateBackendToken,
} from "@/lib/services/backend1Client";

type CoachRequestBody = {
  message?: unknown;
  email?: unknown;
  name?: unknown;
  role?: unknown;
};

export async function POST(req: NextRequest) {
  let payload: CoachRequestBody;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 });
  }

  const { message, email, name, role } = payload;

  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ success: false, message: "message is required" }, { status: 400 });
  }
  if (typeof email !== "string" || !email.trim()) {
    return NextResponse.json({ success: false, message: "email is required" }, { status: 400 });
  }
  const safeRole = role === "admin" ? "admin" : "student";
  const safeName = typeof name === "string" && name.trim() ? name : email;

  try {
    const token = await getBackendToken(email, safeName, safeRole);
    let result = await callCoachMessage(token, message);

    // A cached token can go stale (backend-1 restarted, JWT expired) - retry
    // once with a freshly issued token rather than surfacing a confusing
    // 401 for something the caller never did wrong.
    if (!result.ok && result.status === 401) {
      invalidateBackendToken(email);
      const freshToken = await getBackendToken(email, safeName, safeRole, true);
      result = await callCoachMessage(freshToken, message);
    }

    if (!result.ok) {
      // Mirror backend-1's own status codes (422 guardrail block, 429 rate
      // limit, etc.) rather than collapsing everything to a generic error.
      return NextResponse.json(
        { success: false, message: result.message, reason: result.reason },
        { status: result.status || 502 }
      );
    }

    return NextResponse.json({ success: true, reply: result.reply, intent: result.intent });
  } catch (err) {
    if (err instanceof BackendUnavailableError) {
      return NextResponse.json(
        { success: false, message: "The backend is currently unreachable.", offline: true },
        { status: 503 }
      );
    }
    return NextResponse.json({ success: false, message: "Unexpected error contacting the AI Coach." }, { status: 500 });
  }
}
