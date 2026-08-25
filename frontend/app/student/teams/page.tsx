"use client";

import Link from "next/link";
import { usePlatform } from "@/lib/data/platform-store";
import { useI18n } from "@/lib/i18n/provider";
import { formatT } from "@/lib/i18n/format";

export default function TeamsPage() {
  const store = usePlatform();
  const { t } = useI18n();
  return (
    <div>
      <h1 className="font-serif text-3xl">{t.teams}</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {store.teams.map((team) => {
          const members = team.members;
          const xp = members.reduce((s, m) => s + (store.studentProfiles.find((p) => p.userId === m.studentId)?.xp ?? 0), 0);
          return (
            <Link key={team.id} href={`/student/teams/${team.id}`} className="k-card p-4">
              <p className="font-medium">{team.name}</p>
              <p className="text-sm text-muted">{team.projectTitle}</p>
              <p className="mt-2 text-xs">
                {formatT(t.rankCombinedXpMembers, { rank: team.rank, xp, members: members.length })}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
