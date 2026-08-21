"use client";

import { useParams } from "next/navigation";
import { ProgressBar } from "@/components/ui/progress";
import { usePlatform } from "@/lib/data/platform-store";

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const store = usePlatform();
  const team = store.teams.find((t) => t.id === id);
  const members = store.teamMembers.filter((m) => m.teamId === id);
  if (!team) return <p>Team not found.</p>;
  const total = members.reduce((s, m) => s + m.contribution, 0) || 1;
  return (
    <div>
      <h1 className="font-serif text-3xl">{team.name}</h1>
      <p className="mt-1 text-sm text-stone-600">
        {team.projectTitle} · squad rank {team.rank}
      </p>
      <ul className="mt-6 space-y-4">
        {members.map((m) => {
          const u = store.users.find((x) => x.id === m.studentId);
          const xp = store.studentProfiles.find((p) => p.userId === m.studentId)?.xp ?? 0;
          return (
            <li key={m.studentId} className="rounded-xl border bg-white p-4">
              <div className="flex justify-between text-sm">
                <span>
                  {u?.name} · {m.role}
                </span>
                <span>
                  {xp} XP · {m.contribution}% share
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
