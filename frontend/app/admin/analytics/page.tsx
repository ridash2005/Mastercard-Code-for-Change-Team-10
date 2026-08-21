"use client";

import ReportsPage from "@/app/admin/reports/page";
import { ProgressBar } from "@/components/ui/progress";
import { usePlatform } from "@/lib/data/platform-store";

export default function AnalyticsPage() {
  const store = usePlatform();
  const max = Math.max(...store.studentProfiles.map((p) => p.xp), 1);
  return (
    <div>
      <h1 className="font-serif text-3xl">Analytics</h1>
      <p className="mt-1 text-sm text-stone-600">Engagement snapshot on top of the same filters as Reports.</p>
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
