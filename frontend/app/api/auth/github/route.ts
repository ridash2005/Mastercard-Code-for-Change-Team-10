// "Continue with GitHub" button target - see app/api/auth/google/route.ts
// for the full rationale, identical pattern for the other provider.

import { NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:5000/api";

export async function GET() {
  return NextResponse.redirect(`${BACKEND_API_URL}/auth/github`);
}
