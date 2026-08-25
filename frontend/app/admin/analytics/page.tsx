"use client";

import ReportsPage from "@/app/admin/reports/page";
import { ProgressBar } from "@/components/ui/progress";
import { usePlatform } from "@/lib/data/platform-store";
import { useI18n } from "@/lib/i18n/provider";

export default function AnalyticsPage() {
  const store = usePlatform();
  const { t } = useI18n();
  const max = Math.max(...store.studentProfiles.map((p) => p.xp), 1);
  return (
    <div>
      <h1 className="font-serif text-3xl">{t.analytics}</h1>
      <p className="mt-1 text-sm text-stone-600">{t.analyticsSubtitle}</p>
      <div className="mt-6 space-y-3 rounded-xl border bg-white p-4">
        {store.studentProfiles.map((p) => (
          <div key={p.userId}>
            <div className="flex justify-between text-xs">
              <span>{store.users.find((u) => u.id === p.userId)?.name}</span>
              <span>{p.xp} XP</span>
            </div>
            <ProgressBar value={(p.xp / max) * 100} className="mt-1" />
          </div>
        ))}
      </div>
      <div className="mt-8">
        <ReportsPage />
      </div>
    </div>
  );
}
