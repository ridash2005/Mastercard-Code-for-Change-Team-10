"use client";

import { PublicShell } from "@/components/layout/public-shell";
import { useI18n } from "@/lib/i18n/provider";

export default function EmergencyPage() {
  const { t } = useI18n();
  return (
    <PublicShell>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-xs uppercase tracking-wide text-red-800">{t.publicEmergencyBadge}</p>
          <h1 className="mt-2 font-serif text-3xl text-red-950">{t.publicEmergencyHeading}</h1>
          <p className="mt-3 text-sm text-red-900">{t.publicEmergencyBody}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a className="rounded-md bg-red-800 px-4 py-2 text-sm text-white" href="tel:112">
              {t.call112}
            </a>
            <a className="rounded-md border border-red-800 px-4 py-2 text-sm" href="tel:112">
              {t.campusSecurityLabel}
            </a>
            <a className="rounded-md border border-red-800 px-4 py-2 text-sm" href="mailto:wellbeing@katalyst.edu">
              {t.wellbeingDesk}
            </a>
          </div>
        </div>
        <div className="mt-8 rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-600">
          <h2 className="font-serif text-xl text-stone-900">{t.afterYouAreSafeHeading}</h2>
          <p className="mt-2">{t.afterYouAreSafeBody}</p>
        </div>
      </div>
    </PublicShell>
  );
}
