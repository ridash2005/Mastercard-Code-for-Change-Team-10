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
            UI reads the mock repository. Mongoose models live in lib/models. Set MONGODB_URI from .env.example when you
            switch off mocks. A live database is not required for this demo.
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">OCR / AI</dt>
          <dd>lib/ocr/service.ts, lib/ai/coach.ts, lib/ai/chatbot.ts and lib/ai/review.ts are explicitly mocked.</dd>
        </div>
      </dl>
    </div>
  );
}
