"use client";

import { AUTH_PROVIDER } from "@/lib/auth/session";

export default function AdminSettings() {
  return (
    <div>
      <h1 className="font-serif text-3xl">Settings</h1>
      <dl className="mt-6 space-y-3 text-sm">
        <div>
          <dt className="text-stone-500">Auth</dt>
          <dd>Provider: {AUTH_PROVIDER}. Passwords are never stored. Swap in Auth.js via lib/auth/config.ts.</dd>
        </div>
        <div>
          <dt className="text-stone-500">Database</dt>
          <dd>
            UI reads the mock repository (lib/data/platform-store.ts). Real persistence lives in backend/api/models,
            behind backend/api&apos;s own MONGO_URI — a live database is not required for this demo.
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">OCR / AI</dt>
          <dd>
            lib/ocr/service.ts, lib/ai/chatbot.ts and lib/ai/review.ts are explicitly mocked. The AI Coach
            (lib/ai/coach.ts&apos;s coachReplyLive) calls the real backend/api AI gateway via /api/coach, falling
            back to a local mock reply only when the backend is unreachable.
          </dd>
        </div>
      </dl>
    </div>
  );
}
