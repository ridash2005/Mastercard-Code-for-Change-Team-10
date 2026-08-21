"use client";

import Link from "next/link";
import { usePlatform } from "@/lib/data/platform-store";

export default function EscalationsPage() {
  const store = usePlatform();
  const risk = store.studentProfiles.filter((p) => p.atRisk || p.inactive);
  const overdueSubs = store.submissions.filter((s) => s.status === "submitted" || s.status === "under_review");
  const orbit = store.teams.find((t) => t.id === "team-orbit");
  return (
    <div>
      <h1 className="font-serif text-3xl">Escalations</h1>
      <section className="mt-6 rounded-xl border bg-white p-4">
        <h2 className="font-medium">At-risk & inactive</h2>
        <ul className="mt-2 text-sm">
          {risk.map((p) => (
            <li key={p.userId}>
              <Link className="underline" href={`/admin/students/${p.userId}`}>
                {store.users.find((u) => u.id === p.userId)?.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-4 rounded-xl border bg-white p-4">
        <h2 className="font-medium">Review backlog</h2>
        <ul className="mt-2 text-sm">
          {overdueSubs.map((s) => (
            <li key={s.id}>
              <Link className="underline" href={`/admin/submissions/${s.id}`}>
                {store.activities.find((a) => a.id === s.activityId)?.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-4 rounded-xl border bg-white p-4 text-sm">
        <h2 className="font-medium">Team issue</h2>
        <p className="mt-2">
          {orbit?.name} contribution is thin versus Nexus. Check {orbit?.projectTitle} before the September demo.
        </p>
      </section>
    </div>
  );
}
