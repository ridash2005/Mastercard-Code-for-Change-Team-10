"use client";

import Link from "next/link";
import { usePlatform } from "@/lib/data/platform-store";
import { useI18n } from "@/lib/i18n/provider";

export default function AdminTeams() {
  const store = usePlatform();
  const { t } = useI18n();
  return (
    <div>
      <h1 className="font-serif text-3xl">{t.teams}</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {store.teams.map((team) => (
          <div key={team.id} className="rounded-xl border bg-white p-4 text-sm">
            <p className="font-medium">{team.name}</p>
            <p className="text-stone-600">{team.projectTitle}</p>
            <ul className="mt-3 space-y-1">
              {team.members.map((m) => (
                <li key={m.studentId}>
                  <Link className="underline" href={`/admin/students/${m.studentId}`}>
                    {m.student?.name}
                  </Link>{" "}
                  · {m.role}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
