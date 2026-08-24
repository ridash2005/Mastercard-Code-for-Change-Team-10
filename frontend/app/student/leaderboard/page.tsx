"use client";

import { useMemo, useState } from "react";
import { usePlatform } from "@/lib/data/platform-store";
import { globalRanks } from "@/lib/services/repository";
import { cn } from "@/lib/utils";

export default function LeaderboardPage() {
  const store = usePlatform();
  const [tab, setTab] = useState<"global" | "weekly" | "monthly" | "team">("global");
  const global = globalRanks(store.studentProfiles);
  const weekly = [...global].sort((a, b) => b.streak - a.streak);
  const monthly = [...global].sort((a, b) => a.userId.localeCompare(b.userId));
  const rows = tab === "team" ? [] : tab === "weekly" ? weekly : tab === "monthly" ? monthly : global;
  const teamRows = useMemo(() => {
    return store.teams.map((t) => {
      const xp = store.teamMembers
        .filter((m) => m.teamId === t.id)
        .reduce((sum, m) => sum + (store.studentProfiles.find((p) => p.userId === m.studentId)?.xp ?? 0), 0);
      return { ...t, xp };
    }).sort((a, b) => b.xp - a.xp);
  }, [store.teams, store.teamMembers, store.studentProfiles]);

  return (
    <div>
      <h1 className="font-serif text-3xl">Leaderboard</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {(["global", "weekly", "monthly", "team"] as const).map((k) => (
          <button
            key={k}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium capitalize",
              tab === k ? "bg-barbie text-white" : "border border-line bg-card text-plum",
            )}
            onClick={() => setTab(k)}
          >
            {k}
          </button>
        ))}
      </div>
      {tab === "team" ? (
        <ol className="k-card mt-4">
          {teamRows.map((t, i) => (
            <li key={t.id} className="flex justify-between border-b border-line px-4 py-2 text-sm last:border-0">
              <span className="text-plum">
                <span className={cn("mr-2", i < 3 ? "text-gold" : "text-purple")}>#{i + 1}</span>
                {t.name}
              </span>
              <span className="font-semibold text-gold">{t.xp} XP</span>
            </li>
          ))}
        </ol>
      ) : (
        <ol className="k-card mt-4">
          {rows.map((r, i) => (
            <li key={r.userId} className="flex justify-between border-b border-line px-4 py-2 text-sm last:border-0">
              <span className="text-plum">
                <span className={cn("mr-2", i < 3 ? "text-gold" : "text-purple")}>#{i + 1}</span>
                {store.users.find((u) => u.id === r.userId)?.name}
              </span>
              <span className="font-semibold text-gold">{r.xp} XP</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
