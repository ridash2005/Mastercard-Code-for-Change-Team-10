"use client";

import { MissionCard } from "@/components/cards";
import { usePlatform } from "@/lib/data/platform-store";
import { useI18n } from "@/lib/i18n/provider";

export default function MissionsPage() {
  const store = usePlatform();
  const { t } = useI18n();
  return (
    <div>
      <h1 className="font-serif text-3xl">{t.missions}</h1>
      <p className="mt-1 text-sm text-muted">{t.missionsSubtitle}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {store.missions.map((m) => (
          <MissionCard key={m.id} title={m.title} description={m.description} current={m.period === "week" ? 1 : m.unit === "xp" ? 260 : 0} target={m.target} />
        ))}
      </div>
    </div>
  );
}
