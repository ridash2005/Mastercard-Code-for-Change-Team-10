// Real OCR: browser -> this route -> OCR.space's REST API. The API key
// stays server-side (OCR_SPACE_API_KEY in frontend/.env.local, never
// exposed to client JS) - same pattern as every other third-party-secret
// route in this app (see app/api/coach/route.ts, app/api/auth/*).
//
// OCR.space returns raw recognized text, not structured fields - this
// route does the (best-effort, regex-based) extraction of name/email/
// college/programme from that text server-side, so the client only ever
// gets the fields the registration form actually needs.

import { NextRequest, NextResponse } from "next/server";

const OCR_SPACE_API_KEY = process.env.OCR_SPACE_API_KEY;
// The free-tier endpoint - OCR_SPACE_API_KEY is a free-plan key (25,000
// requests/month, 1MB/file on the free engine). Point at apipro*.ocr.space
// instead if this is ever upgraded to a paid plan.
const OCR_SPACE_URL = "https://api.ocr.space/parse/image";

export type OcrFields = {
  name: string;
  email: string;
  college: string;
  programme: string;
};

function extractFields(rawText: string): OcrFields {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch?.[0] ?? "";

  const collegeLine = lines.find((l) => !l.includes("@") && /college|university|institute|iit|nit/i.test(l));

  // Best-effort name guess: the first line that looks like a person's name
  // (letters/spaces only, 2-4 words, not the college/email line).
  const nameLine = lines.find(
    (l) =>
      l !== collegeLine &&
      !l.includes("@") &&
      /^[A-Za-z][A-Za-z.\s]{3,60}$/.test(l) &&
      l.split(/\s+/).length >= 2 &&
      l.split(/\s+/).length <= 4,
  );

  return {
    name: nameLine ?? "",
    email,
    college: collegeLine ?? "",
    programme: "Katalyst Fellows 2026",
  };
}

export async function POST(req: NextRequest) {
  if (!OCR_SPACE_API_KEY) {
    return NextResponse.json(
      { success: false, message: "OCR is not configured on this server (OCR_SPACE_API_KEY missing)." },
      { status: 503 },
    );
  }

  const incoming = await req.formData().catch(() => null);
  const file = incoming?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, message: "file is required (multipart/form-data)" }, { status: 400 });
  }
  // OCR.space's free plan caps uploads at 1MB per file.
  if (file.size > 1024 * 1024) {
    return NextResponse.json({ success: false, message: "File must be under 1MB on the free OCR plan." }, { status: 400 });
  }

  const upstream = new FormData();
  upstream.set("apikey", OCR_SPACE_API_KEY);
  upstream.set("language", "eng");
  upstream.set("isOverlayRequired", "false");
  upstream.set("scale", "true");
  upstream.set("OCREngine", "2");
  upstream.set("file", file, file.name);

  let res: Response;
  try {
    res = await fetch(OCR_SPACE_URL, { method: "POST", body: upstream });
  } catch {
    return NextResponse.json({ success: false, message: "OCR.space is unreachable." }, { status: 502 });
  }

  const body = await res.json().catch(() => null);
  if (!res.ok || !body || body.IsErroredOnProcessing) {
    const message =
      (Array.isArray(body?.ErrorMessage) ? body.ErrorMessage[0] : body?.ErrorMessage) ??
      "OCR could not process this document.";
    return NextResponse.json({ success: false, message }, { status: 422 });
  }

  const rawText: string = body?.ParsedResults?.[0]?.ParsedText ?? "";
  if (!rawText.trim()) {
    return NextResponse.json({ success: false, message: "No text detected in this document." }, { status: 422 });
  }

  return NextResponse.json({ success: true, data: extractFields(rawText) });
}
