"use client";

import Link from "next/link";
import { usePlatform } from "@/lib/data/platform-store";
import { attentionRows } from "@/lib/admin/insights";
import { formatDate } from "@/lib/utils";

export default function AttentionPage() {
  const store = usePlatform();
  const rows = attentionRows(store.studentProfiles, store.users, store.enrollments, store.activities);
  return (
    <div>
      <h1 className="font-serif text-3xl">Students requiring attention</h1>
      <p className="mt-1 text-sm text-muted">Based on existing at-risk and inactive flags, overdue enrolments, and low completion.</p>
      <ul className="mt-6 space-y-3">
        {rows.map((row) => (
          <li key={row.userId} className="k-card p-4">
            <p className="font-medium text-plum">{row.name}</p>
            <p className="text-sm text-muted">
              {row.reason} · {row.metric} · last active {formatDate(row.lastActive)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={row.href} className="inline-flex rounded-full bg-barbie px-3.5 py-2 text-sm font-medium text-white">
                View student
              </Link>
              <Link href="/admin/escalations" className="inline-flex rounded-full border border-plum/20 bg-ivory px-3.5 py-2 text-sm font-medium text-plum">
                Take action
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
