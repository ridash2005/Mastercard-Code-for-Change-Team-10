"use client";

import { useParams } from "next/navigation";
import { DashboardCard } from "@/components/cards";
import { StatusBadge } from "@/components/states";
import { usePlatform } from "@/lib/data/platform-store";
import { levelFromXp } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

export default function AdminStudentDetail() {
  const { id } = useParams<{ id: string }>();
  const store = usePlatform();
  const { t } = useI18n();
  const user = store.users.find((u) => u.id === id);
  const profile = store.studentProfiles.find((p) => p.userId === id);
  const team = store.teams.find((tm) => tm.id === profile?.teamId);
  const history = store.enrollments.filter((e) => e.studentId === id);
  if (!user || !profile) return <p>{t.notFoundLabel}</p>;
  const done = history.filter((e) => e.status === "completed" || e.status === "approved").length;
  const rate = history.length ? Math.round((done / history.length) * 100) : 0;
  return (
    <div>
      <h1 className="font-serif text-3xl">{user.name}</h1>
      <p className="text-sm text-stone-600">
        {user.college} · {user.programme} · {team?.name}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <DashboardCard label={t.xpShortLabel} value={profile.xp} hint={`${t.level} ${levelFromXp(profile.xp).level}`} />
        <DashboardCard label={t.completionLabel} value={`${rate}%`} />
        <DashboardCard label={t.streak} value={profile.streak} />
        <DashboardCard label={t.flagsLabel} value={profile.atRisk ? t.flagAtRisk : profile.inactive ? t.flagInactive : t.flagHealthy} />
      </div>
      <h2 className="mt-8 font-serif text-xl">{t.activityHistoryHeading}</h2>
      <ul className="mt-3 divide-y rounded-xl border bg-white text-sm">
        {history.map((e) => (
          <li key={e.id} className="flex justify-between px-4 py-2">
            <span>{store.activities.find((a) => a.id === e.activityId)?.title}</span>
            <StatusBadge status={e.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}
