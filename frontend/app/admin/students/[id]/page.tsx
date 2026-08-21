"use client";

import { useParams } from "next/navigation";
import { DashboardCard } from "@/components/cards";
import { usePlatform } from "@/lib/data/platform-store";
import { levelFromXp } from "@/lib/utils";

export default function AdminStudentDetail() {
  const { id } = useParams<{ id: string }>();
  const store = usePlatform();
  const user = store.users.find((u) => u.id === id);
  const profile = store.studentProfiles.find((p) => p.userId === id);
  const team = store.teams.find((t) => t.id === profile?.teamId);
  const history = store.enrollments.filter((e) => e.studentId === id);
  if (!user || !profile) return <p>Not found.</p>;
  const done = history.filter((e) => e.status === "completed" || e.status === "approved").length;
  const rate = history.length ? Math.round((done / history.length) * 100) : 0;
  return (
    <div>
      <h1 className="font-serif text-3xl">{user.name}</h1>
      <p className="text-sm text-stone-600">
        {user.college} · {user.programme} · {team?.name}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <DashboardCard label="XP" value={profile.xp} hint={`Level ${levelFromXp(profile.xp).level}`} />
        <DashboardCard label="Completion" value={`${rate}%`} />
        <DashboardCard label="Streak" value={profile.streak} />
        <DashboardCard label="Flags" value={profile.atRisk ? "At-risk" : profile.inactive ? "Inactive" : "Healthy"} />
      </div>
      <h2 className="mt-8 font-serif text-xl">Activity history</h2>
      <ul className="mt-3 divide-y rounded-xl border bg-white text-sm">
        {history.map((e) => (
          <li key={e.id} className="flex justify-between px-4 py-2">
            <span>{store.activities.find((a) => a.id === e.activityId)?.title}</span>
            <span>{e.status.replaceAll("_", " ")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
