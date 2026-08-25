"use client";

import { useState } from "react";
import { EmptyState } from "@/components/states";
import { usePlatform } from "@/lib/data/platform-store";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

export default function LeaderboardPage() {
  const store = usePlatform();
  const { t } = useI18n();
  const [tab, setTab] = useState<"global" | "team">("global");
  const tabLabels = { global: t.globalTabLabel, team: t.teamTabLabel };
  // Global rows come pre-joined (name + xp + rank) from backend/api's
  // GET /api/gamification/leaderboard, which - unlike studentProfiles/users
  // - every role can see in full (it's the one place a student session gets
  // more than just their own profile back). Weekly/monthly cuts aren't
  // exposed by that endpoint yet, so this page only offers what's real.
  const rows = store.leaderboard;
  const teamRows = [...store.teams].sort((a, b) => a.rank - b.rank);

  return (
    <div>
      <h1 className="font-serif text-3xl">{t.leaderboard}</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {(["global", "team"] as const).map((k) => (
          <button
            key={k}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium",
              tab === k ? "bg-barbie text-white" : "border border-line bg-card text-plum",
            )}
            onClick={() => setTab(k)}
          >
            {tabLabels[k]}
          </button>
        ))}
      </div>
      {tab === "team" ? (
        teamRows.length === 0 ? (
          <div className="mt-8"><EmptyState title={t.noTeamsYet} /></div>
        ) : (
          <ol className="k-card mt-4">
            {teamRows.map((t, i) => (
              <li key={t.id} className="flex justify-between border-b border-line px-4 py-2 text-sm last:border-0">
                <span className="text-plum">
                  <span className={cn("mr-2", i < 3 ? "text-gold" : "text-purple")}>#{t.rank}</span>
                  {t.name}
                </span>
                <span className="font-semibold text-gold">{t.projectTitle}</span>
              </li>
            ))}
          </ol>
        )
      ) : rows.length === 0 ? (
        <div className="mt-8"><EmptyState title={t.noRankedStudentsYet} /></div>
      ) : (
        <ol className="k-card mt-4">
          {rows.map((r) => (
            <li key={r.userId} className="flex justify-between border-b border-line px-4 py-2 text-sm last:border-0">
              <span className="text-plum">
                <span className={cn("mr-2", r.rank <= 3 ? "text-gold" : "text-purple")}>#{r.rank}</span>
                {r.name}
              </span>
              <span className="font-semibold text-gold">{r.xp} XP</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
