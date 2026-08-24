"use client";

export default function AdminSettings() {
  return (
    <div>
      <h1 className="font-serif text-3xl">Settings</h1>
      <dl className="mt-6 space-y-3 text-sm">
        <div>
          <dt className="text-stone-500">Auth</dt>
          <dd>
            Real backend/api auth: bcrypt-checked password, JWT in an httpOnly cookie. Passwords are never stored in
            the frontend.
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">Database</dt>
          <dd>
            Activities, enrollments, submissions, gamification, teams, notifications, feedback, complaints,
            certificates, extracurricular, meetings, and collaborations/volunteer applications all read and write
            through backend/api&apos;s real MongoDB-backed REST API (see lib/services/api.ts).
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">AI</dt>
          <dd>
            The AI Coach and the AI Judge submission scoring above both call a real LLM through backend/api&apos;s
            guardrailed AI gateway. lib/ai/chatbot.ts (the general help widget) is still a canned/local reply.
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">OCR</dt>
          <dd>lib/ocr/service.ts (registration document scan) is still mocked.</dd>
        </div>
      </dl>
    </div>
  );
}
