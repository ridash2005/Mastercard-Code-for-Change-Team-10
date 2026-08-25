"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePlatform } from "@/lib/data/platform-store";
import { completionByType, completionForStudent, overdueForStudent, upcomingForStudent } from "@/lib/admin/insights";
import { BarRows } from "@/components/admin/charts";
import { Dialog } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n/provider";

export default function CompletionPage() {
  const store = usePlatform();
  const { t } = useI18n();
  const TYPE_LABEL = {
    course: t.courses,
    training: t.trainingSessions,
    mentoring: t.mentoring,
    project: t.projects,
    assignment: t.assignments,
    milestone: t.milestones,
  } as const;
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
        hint: row.total ? `${row.completed}/${row.total}` : t.noEnrolmentsLabel,
      }))
    : [];
  const overdue = selected ? overdueForStudent(store.enrollments, store.activities, selected.userId) : [];
  const upcoming = selected ? upcomingForStudent(store.enrollments, store.activities, selected.userId) : [];

  return (
    <div>
      <h1 className="font-serif text-3xl">{t.activityCompletion}</h1>
      <p className="mt-1 text-sm text-muted">{t.completionSubtitle}</p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[20rem] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="py-2 font-medium">{t.studentColumnLabel}</th>
              <th className="py-2 font-medium">{t.completionLabel}</th>
              <th className="py-2 font-medium">{t.doneTotalLabel}</th>
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
      <Dialog open={Boolean(selected)} title={selected?.name ?? t.studentFallback} onClose={() => setOpenId(null)}>
        {selected ? (
          <div className="space-y-4 text-sm">
            <p>
              {t.overallLabel} {selected.pct}% · {selected.completed} {t.status_completed.toLowerCase()} · {selected.inProgress} {t.status_in_progress.toLowerCase()} · {selected.total} {t.totalWord}
            </p>
            <p>
              {t.overdueWord} {overdue.length} · {t.upcomingWord} {upcoming.length}
            </p>
            <BarRows rows={bars} />
            <Link href={`/admin/students/${selected.userId}`} className="inline-block font-medium text-barbie">
              {t.openStudentProfileLink}
            </Link>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
