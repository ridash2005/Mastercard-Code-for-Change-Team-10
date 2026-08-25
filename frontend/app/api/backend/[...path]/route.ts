// Generic authenticated proxy: browser -> this route -> backend/api's real
// REST surface (activities, enrollments, submissions, gamification, teams,
// notifications, feedback, complaints, certificates, extracurricular,
// meetings, contact, users, admin analytics). Mirrors the pattern already
// established by app/api/auth/* and app/api/coach/route.ts - the real JWT
// lives only in the httpOnly session cookie (see lib/auth/cookies.ts) and
// never reaches client JS; this route reads it server-side and attaches it
// as a Bearer token on the way to backend/api.
//
// Frontend code should go through lib/services/api.ts's typed helpers
// rather than calling this route directly - see that file for the resource
// list and response shapes.

import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/cookies";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:5000/api";

async function proxy(req: NextRequest, segments: string[]) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const path = segments.map(encodeURIComponent).join("/");
  const url = `${BACKEND_API_URL}/${path}${req.nextUrl.search}`;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "DELETE") {
    const text = await req.text();
    if (text) body = text;
  }

  let res: Response;
  try {
    res = await fetch(url, { method: req.method, headers, body });
  } catch {
    return NextResponse.json(
      { success: false, message: "backend/api is unreachable. Is it running?" },
      { status: 502 }
    );
  }

  const contentType = res.headers.get("Content-Type") ?? "application/json";
  const isBinary = !contentType.includes("json") && !contentType.startsWith("text/");
  const responseBody = isBinary ? await res.arrayBuffer() : await res.text();

  const outHeaders: Record<string, string> = { "Content-Type": contentType };
  const disposition = res.headers.get("Content-Disposition");
  if (disposition) outHeaders["Content-Disposition"] = disposition;

  return new NextResponse(responseBody, { status: res.status, headers: outHeaders });
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  return proxy(req, (await ctx.params).path);
}
export async function POST(req: NextRequest, ctx: RouteContext) {
  return proxy(req, (await ctx.params).path);
}
export async function PUT(req: NextRequest, ctx: RouteContext) {
  return proxy(req, (await ctx.params).path);
}
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  return proxy(req, (await ctx.params).path);
}
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  return proxy(req, (await ctx.params).path);
}
