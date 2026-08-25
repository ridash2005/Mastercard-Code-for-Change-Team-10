"use client";

import { useI18n } from "@/lib/i18n/provider";

export default function StudentEmergency() {
  const { t } = useI18n();
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
      <p className="text-xs uppercase tracking-wide text-red-800">{t.emergencySeparatedNote}</p>
      <h1 className="mt-2 font-serif text-3xl">{t.emergency}</h1>
      <p className="mt-3 text-sm">{t.emergencyCallFirst}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a className="rounded-md bg-red-800 px-4 py-2 text-sm text-white" href="tel:112">
          {t.call112}
        </a>
        <a className="rounded-md border border-red-800 px-4 py-2 text-sm" href="mailto:wellbeing@katalyst.edu">
          {t.wellbeingDesk}
        </a>
      </div>
    </div>
  );
}
