"use client";

import { useMemo, useState } from "react";
import { usePlatform } from "@/lib/data/platform-store";
import { globalRanks } from "@/lib/services/repository";

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
            className={`rounded-md px-3 py-1 text-sm capitalize ${tab === k ? "bg-forest text-white" : "border"}`}
            onClick={() => setTab(k)}
          >
            {k}
          </button>
        ))}
      </div>
      {tab === "team" ? (
        <ol className="mt-4 rounded-xl border bg-white">
          {teamRows.map((t, i) => (
            <li key={t.id} className="flex justify-between px-4 py-2 text-sm">
              <span>
                #{i + 1} {t.name}
              </span>
              <span>{t.xp} XP</span>
            </li>
          ))}
        </ol>
      ) : (
        <ol className="mt-4 rounded-xl border bg-white">
          {rows.map((r, i) => (
            <li key={r.userId} className="flex justify-between px-4 py-2 text-sm">
              <span>
                #{i + 1} {store.users.find((u) => u.id === r.userId)?.name}
              </span>
              <span>{r.xp} XP</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
