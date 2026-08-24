"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePlatform } from "@/lib/data/platform-store";
import { completionByType, completionForStudent, overdueForStudent, upcomingForStudent } from "@/lib/admin/insights";
import { BarRows } from "@/components/admin/charts";
import { Dialog } from "@/components/ui/dialog";

const TYPE_LABEL = {
  course: "Courses",
  training: "Training",
  mentoring: "Mentoring",
  project: "Projects",
  assignment: "Assignments",
  milestone: "Milestones",
} as const;

export default function CompletionPage() {
  const store = usePlatform();
  const [openId, setOpenId] = useState<string | null>(null);
  const rows = useMemo(
    () =>
      store.studentProfiles.map((p) => ({
        ...completionForStudent(store.enrollments, p.userId),
        userId: p.userId,
        name: store.users.find((u) => u.id === p.userId)?.name ?? p.userId,
      })),
    [store.enrollments, store.studentProfiles, store.users],
  );
  const selected = rows.find((r) => r.userId === openId);
  const bars = selected
    ? completionByType(store.enrollments, store.activities, selected.userId).map((row) => ({
        label: TYPE_LABEL[row.type],
        pct: row.pct,
        hint: row.total ? `${row.completed}/${row.total}` : "No enrolments",
      }))
    : [];
  const overdue = selected ? overdueForStudent(store.enrollments, store.activities, selected.userId) : [];
  const upcoming = selected ? upcomingForStudent(store.enrollments, store.activities, selected.userId) : [];

  return (
    <div>
      <h1 className="font-serif text-3xl">Activity Completion</h1>
      <p className="mt-1 text-sm text-muted">Completion is completed or approved enrolments divided by that student’s enrolments.</p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[20rem] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="py-2 font-medium">Student</th>
              <th className="py-2 font-medium">Completion</th>
              <th className="py-2 font-medium">Done / total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.userId} className="border-b border-line">
                <td className="py-2">
                  <button type="button" className="font-medium text-plum hover:text-barbie" onClick={() => setOpenId(row.userId)}>
                    {row.name}
                  </button>
                </td>
                <td className="py-2 font-semibold text-blue">{row.pct}%</td>
                <td className="py-2 text-muted">
                  {row.completed}/{row.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={Boolean(selected)} title={selected?.name ?? "Student"} onClose={() => setOpenId(null)}>
        {selected ? (
          <div className="space-y-4 text-sm">
            <p>
              Overall {selected.pct}% · {selected.completed} completed · {selected.inProgress} in progress · {selected.total} total
            </p>
            <p>
              Overdue {overdue.length} · upcoming {upcoming.length}
            </p>
            <BarRows rows={bars} />
            <Link href={`/admin/students/${selected.userId}`} className="inline-block font-medium text-barbie">
              Open student profile
            </Link>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
