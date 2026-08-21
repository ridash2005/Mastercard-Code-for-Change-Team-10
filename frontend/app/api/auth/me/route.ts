// Returns the real backend/api user for the current session cookie, or null.
// Used by server components/pages that need to know who's really logged in
// (as opposed to the mock store's sessionUserId, which is being phased out
// page by page).

import { NextRequest, NextResponse } from "next/server";
import { getMe } from "@/lib/services/backendClient";
import { AUTH_COOKIE_NAME } from "@/lib/auth/cookies";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ success: true, user: null });
  }

  const user = await getMe(token);
  return NextResponse.json({ success: true, user });
}
