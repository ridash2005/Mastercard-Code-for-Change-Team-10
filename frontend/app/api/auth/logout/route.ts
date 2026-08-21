import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/cookies";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(AUTH_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  res.cookies.set("katalyst-role", "", { path: "/", maxAge: 0 });
  res.cookies.set("katalyst-user", "", { path: "/", maxAge: 0 });
  return res;
}
