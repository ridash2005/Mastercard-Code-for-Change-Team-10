export type OcrFields = {
  name: string;
  email: string;
  college: string;
  programme: string;
};

/**
 * Real OCR via OCR.space (see app/api/ocr/route.ts, which holds the API
 * key server-side and does the name/email/college extraction from the
 * recognized text). Falls back to empty fields - never fabricated data -
 * if OCR.space is unreachable or the server isn't configured with a key,
 * so a broken/missing key degrades to "nothing extracted, fill in by hand"
 * rather than silently lying about what was read from the document.
 */
export async function extractFromDocument(file: File): Promise<OcrFields> {
  const empty: OcrFields = { name: "", email: "", college: "", programme: "Katalyst Fellows 2026" };

  const body = new FormData();
  body.set("file", file, file.name);

  let res: Response;
  try {
    res = await fetch("/api/ocr", { method: "POST", body });
  } catch {
    return empty;
  }

  const parsed = await res.json().catch(() => null);
  if (!res.ok || !parsed?.success) return empty;
  return parsed.data as OcrFields;
}
