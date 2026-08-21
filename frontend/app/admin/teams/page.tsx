"use client";

import Link from "next/link";
import { usePlatform } from "@/lib/data/platform-store";

export default function AdminTeams() {
  const store = usePlatform();
  return (
    <div>
      <h1 className="font-serif text-3xl">Teams</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {store.teams.map((t) => {
          const members = store.teamMembers.filter((m) => m.teamId === t.id);
          return (
            <div key={t.id} className="rounded-xl border bg-white p-4 text-sm">
              <p className="font-medium">{t.name}</p>
              <p className="text-stone-600">{t.projectTitle}</p>
              <ul className="mt-3 space-y-1">
                {members.map((m) => (
                  <li key={m.studentId}>
                    <Link className="underline" href={`/admin/students/${m.studentId}`}>
                      {store.users.find((u) => u.id === m.studentId)?.name}
                    </Link>{" "}
                    · {m.role}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
