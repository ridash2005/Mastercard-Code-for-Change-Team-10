// The second half of Google/GitHub sign-in: app/auth/callback/page.tsx
// POSTs the one-time code it got from the OAuth callback redirect here,
// this trades it for the real JWT via backend/api's own one-time exchange
// (see backendClient.ts's exchangeOAuthCode and backend/api's
// controllers/oauthController.js), and sets the same httpOnly session
// cookie a normal password login would - see app/api/auth/login/route.ts.

import { NextRequest, NextResponse } from "next/server";
import { exchangeOAuthCode } from "@/lib/services/backendClient";
import { setSessionCookies } from "@/lib/auth/cookies";

export async function POST(req: NextRequest) {
  let payload: { code?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 });
  }

  const { code } = payload;
  if (typeof code !== "string" || !code) {
    return NextResponse.json({ success: false, message: "code is required" }, { status: 400 });
  }

  const result = await exchangeOAuthCode(code);
  if (!result.ok) {
    return NextResponse.json({ success: false, message: result.message }, { status: result.status || 400 });
  }

  const res = NextResponse.json({ success: true, user: result.user });
  setSessionCookies(res, result.token, result.user.role, result.user.id);
  return res;
}
