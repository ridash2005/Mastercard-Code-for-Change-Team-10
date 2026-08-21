// Real login: browser -> this route -> backend/api's real /auth/login
// (bcrypt password check against the real Mongo user). See register/route.ts
// for the cookie-setting rationale.

import { NextRequest, NextResponse } from "next/server";
import { loginRealUser } from "@/lib/services/backendClient";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from "@/lib/auth/cookies";

export async function POST(req: NextRequest) {
  let payload: { email?: unknown; password?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 });
  }

  const { email, password } = payload;
  if (typeof email !== "string" || !email.trim()) {
    return NextResponse.json({ success: false, message: "email is required" }, { status: 400 });
  }
  if (typeof password !== "string" || !password) {
    return NextResponse.json({ success: false, message: "password is required" }, { status: 400 });
  }

  const result = await loginRealUser(email, password);
  if (!result.ok) {
    return NextResponse.json({ success: false, message: result.message }, { status: result.status || 401 });
  }

  const res = NextResponse.json({ success: true, user: result.user });
  res.cookies.set(AUTH_COOKIE_NAME, result.token, AUTH_COOKIE_OPTIONS);
  res.cookies.set("katalyst-role", result.user.role, { path: "/", sameSite: "lax" });
  res.cookies.set("katalyst-user", result.user.id, { path: "/", sameSite: "lax" });
  return res;
}
