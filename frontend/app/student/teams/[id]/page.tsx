"use client";

import { useParams } from "next/navigation";
import { ProgressBar } from "@/components/ui/progress";
import { usePlatform } from "@/lib/data/platform-store";
import { useI18n } from "@/lib/i18n/provider";

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const store = usePlatform();
  const { t } = useI18n();
  const team = store.teams.find((tm) => tm.id === id);
  const members = team?.members ?? [];
  if (!team) return <p>{t.teamNotFound}</p>;
  const total = members.reduce((s, m) => s + m.contribution, 0) || 1;
  return (
    <div>
      <h1 className="font-serif text-3xl">{team.name}</h1>
      <p className="mt-1 text-sm text-muted">
        {team.projectTitle} · {t.squadRankLabel} {team.rank}
      </p>
      <ul className="mt-6 space-y-4">
        {members.map((m) => {
          const xp = store.studentProfiles.find((p) => p.userId === m.studentId)?.xp ?? 0;
          return (
            <li key={m.studentId} className="k-card p-4">
              <div className="flex justify-between text-sm">
                <span>
                  {m.student?.name} · {m.role}
                </span>
                <span>
                  {xp} XP · {m.contribution}% {t.shareLabel}
                </span>
              </div>
              <ProgressBar className="mt-2" value={(m.contribution / total) * 100} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
