// Real registration: browser -> this route -> backend/api's real
// /auth/register (bcrypt-hashed password, real Mongo user). On success, the
// real JWT is stored in an httpOnly cookie - never readable by client JS -
// plus katalyst-role/katalyst-user cookies (read by proxy.ts for
// route-guard redirects) and lib/data/platform-store.ts's session state.

import { NextRequest, NextResponse } from "next/server";
import { registerRealUser } from "@/lib/services/backendClient";
import { setSessionCookies } from "@/lib/auth/cookies";

export async function POST(req: NextRequest) {
  let payload: { name?: unknown; email?: unknown; password?: unknown; role?: unknown; college?: unknown; programme?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 });
  }

  const { name, email, password, role, college, programme } = payload;

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ success: false, message: "name is required" }, { status: 400 });
  }
  if (typeof email !== "string" || !email.trim()) {
    return NextResponse.json({ success: false, message: "email is required" }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 6) {
    return NextResponse.json({ success: false, message: "password must be at least 6 characters" }, { status: 400 });
  }
  const safeRole = role === "admin" ? "admin" : "student";

  const result = await registerRealUser({
    name,
    email,
    password,
    role: safeRole,
    college: typeof college === "string" ? college : undefined,
    programme: typeof programme === "string" ? programme : undefined
  });

  if (!result.ok) {
    return NextResponse.json({ success: false, message: result.message }, { status: result.status || 400 });
  }

  const res = NextResponse.json({ success: true, user: result.user });
  setSessionCookies(res, result.token, result.user.role, result.user.id);
  return res;
}
