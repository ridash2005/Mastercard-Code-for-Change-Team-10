"use client";

import { useI18n } from "@/lib/i18n/provider";

export default function AdminSettings() {
  const { t } = useI18n();
  return (
    <div>
      <h1 className="font-serif text-3xl">{t.settings}</h1>
      <dl className="mt-6 space-y-3 text-sm">
        <div>
          <dt className="text-stone-500">{t.settingsAuthLabel}</dt>
          <dd>{t.settingsAuthDesc}</dd>
        </div>
        <div>
          <dt className="text-stone-500">{t.settingsDatabaseLabel}</dt>
          <dd>
            Activities, enrollments, submissions, gamification, teams, notifications, feedback, complaints,
            certificates, extracurricular, meetings, and collaborations/volunteer applications all read and write
            through backend/api&apos;s real MongoDB-backed REST API (see lib/services/api.ts).
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">{t.settingsAiLabel}</dt>
          <dd>
            AI Coach, AI Judge submission scoring, the general Chatbot, and the AI Course Designer all call a real
            LLM through backend/api&apos;s guardrailed AI gateway. The Chatbot can also act for you (enroll, submit
            feedback/complaints, mark notifications read, reschedule, draft a course) - see
            services/ai/chatbotService.js.
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">{t.settingsOcrLabel}</dt>
          <dd>
            Real OCR.space API call (lib/ocr/service.ts, proxied through app/api/ocr/route.ts) - reads
            name/email/college off an uploaded registration document.
          </dd>
        </div>
      </dl>
    </div>
  );
}
