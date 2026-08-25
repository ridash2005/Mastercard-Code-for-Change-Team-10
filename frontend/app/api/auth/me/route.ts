// Returns the real backend/api user for the current session cookie, or null.
// Used by server components/pages that need to know who's logged in without
// going through the client-side store (lib/data/platform-store.ts's
// sessionUserId holds the same real backend id, but only after it hydrates
// client-side).

import { NextRequest, NextResponse } from "next/server";
import { getMe } from "@/lib/services/backendClient";
import { AUTH_COOKIE_NAME, clearSessionCookies, touchSessionCookies } from "@/lib/auth/cookies";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ success: true, user: null });
  }

  const user = await getMe(token);
  const res = NextResponse.json({ success: true, user });

  // Sliding session, same as app/api/backend/[...path]/route.ts: a page
  // load that still resolves to a real user counts as activity.
  if (user) touchSessionCookies(res, req);
  else clearSessionCookies(res);

  return res;
}
