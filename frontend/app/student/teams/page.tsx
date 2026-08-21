"use client";

import Link from "next/link";
import { usePlatform } from "@/lib/data/platform-store";

export default function TeamsPage() {
  const store = usePlatform();
  return (
    <div>
      <h1 className="font-serif text-3xl">Teams</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {store.teams.map((t) => {
          const members = store.teamMembers.filter((m) => m.teamId === t.id);
          const xp = members.reduce((s, m) => s + (store.studentProfiles.find((p) => p.userId === m.studentId)?.xp ?? 0), 0);
          return (
            <Link key={t.id} href={`/student/teams/${t.id}`} className="rounded-xl border bg-white p-4">
              <p className="font-medium">{t.name}</p>
              <p className="text-sm text-stone-600">{t.projectTitle}</p>
              <p className="mt-2 text-xs">
                Rank {t.rank} · {xp} combined XP · {members.length} members
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
