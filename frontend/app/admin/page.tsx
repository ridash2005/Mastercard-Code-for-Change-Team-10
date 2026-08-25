"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardCard } from "@/components/cards";
import { DonutChart } from "@/components/admin/charts";
import { Dialog } from "@/components/ui/dialog";
import { usePlatform } from "@/lib/data/platform-store";
import { activeThisMonth, attentionRows, completionForStudent } from "@/lib/admin/insights";
import { formatDate, levelFromXp } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { formatT } from "@/lib/i18n/format";

function MetricLink({
  href,
  label,
  value,
  hint,
}: {
  href: string;
  label: string;
  value: string | number;
  hint?: string;
}) {
  const { t } = useI18n();
  return (
    <Link href={href} className="block rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-barbie">
      <DashboardCard label={label} value={value} hint={hint} />
      <span className="sr-only">{t.openLabelPrefix} {label}</span>
    </Link>
  );
}

export default function AdminHome() {
  const store = usePlatform();
  const { t } = useI18n();
  const students = store.studentProfiles;
  const month = activeThisMonth(students);
  const pending = store.submissions.filter((s) => s.status === "submitted" || s.status === "under_review").length;
  const avgXp = students.length ? Math.round(students.reduce((a, s) => a + s.xp, 0) / students.length) : 0;
  const completedEn = store.enrollments.filter((e) => e.status === "completed" || e.status === "approved").length;
  const rate = store.enrollments.length ? Math.round((completedEn / store.enrollments.length) * 100) : 0;
  const overdue = store.activities.filter((a) => a.dueDate < "2026-08-21").length;
  const atRisk = students.filter((s) => s.atRisk).length;
  const attention = attentionRows(students, store.users, store.enrollments, store.activities).slice(0, 4);
  const reviews = store.feedbackRecords.slice(0, 3);
  const pendingVolunteers = (store.volunteerApplications ?? []).filter((v) => v.status === "pending").length;
  const [activeOpen, setActiveOpen] = useState(false);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl">{t.programmeDashboardTitle}</h1>
        <p className="mt-1 text-sm text-muted">{t.programmeDashboardSubtitle}</p>
      </div>

      <section>
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-purple">{t.overviewHeading}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricLink href="/admin/students" label={t.studentsNav} value={students.length} hint={t.openDirectoryHint} />
          <MetricLink href="/admin/students" label={t.status_active} value={month.active.length} hint={t.thisMonthHint} />
          <MetricLink href="/admin/completion" label={t.completionRateLabel} value={`${rate}%`} hint={t.byEnrolmentHint} />
          <MetricLink href="/admin/activities" label={t.activities} value={store.activities.length} hint={t.catalogueHint} />
          <MetricLink href="/admin/submissions" label={t.pendingReviewsLabel} value={pending} hint={t.reviewQueueHint} />
          <MetricLink href="/admin/leaderboards" label={t.averageXpLabel} value={avgXp} hint={t.leaderboardHint} />
          <MetricLink href="/admin/escalations" label={t.overdueActivitiesLabel} value={overdue} hint={t.escalationsHint} />
          <MetricLink href="/admin/attention" label={t.atRiskStudentsLabel} value={atRisk} hint={t.needsAttentionHint} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <h2 className="sr-only">{t.engagementSrHeading}</h2>
        <button
          type="button"
          onClick={() => setActiveOpen(true)}
          className="k-card p-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-barbie"
        >
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-purple">{t.activeStudentsThisMonthLabel}</p>
          <div className="mt-3 flex flex-wrap items-center gap-6">
            <DonutChart
              value={month.active.length}
              total={month.total}
              label={formatT(t.activeOfTotalTemplate, { active: month.active.length, total: month.total, pct: month.pct })}
            />
            <div className="text-sm">
              <p className="text-plum">
                {t.activeThisMonthColonLabel}: <strong>{month.active.length} / {month.total}</strong>
              </p>
              <p className="mt-1 text-muted">{formatT(t.pctActiveNotActiveTemplate, { pct: month.pct, inactive: month.inactive.length })}</p>
              <p className="mt-3 font-medium text-barbie">{t.viewStudentActivityLink}</p>
            </div>
          </div>
        </button>
        <Link href="/admin/completion" className="k-card p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-barbie">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-purple">{t.activityCompletionByStudentHeading}</p>
          <ul className="mt-3 divide-y divide-line text-sm">
            {students.map((p) => {
              const u = store.users.find((x) => x.id === p.userId);
              const { pct } = completionForStudent(store.enrollments, p.userId);
              return (
                <li key={p.userId} className="flex justify-between py-2">
                  <span className="text-plum">{u?.name}</span>
                  <span className="font-semibold text-blue">{pct}%</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-sm font-medium text-barbie">{t.openCompletionDetailLink}</p>
        </Link>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="k-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-purple">{t.attentionStudents}</h2>
            <Link href="/admin/attention" className="text-sm font-medium text-barbie">
              {t.viewAll}
            </Link>
          </div>
          <ul className="mt-3 space-y-3">
            {attention.map((row) => (
              <li key={row.userId}>
                <Link href={row.href} className="block rounded-lg hover:bg-ivory">
                  <p className="font-medium text-plum">{row.name}</p>
                  <p className="text-sm text-muted">
                    {row.reason} · {row.metric} · {t.lastWord} {formatDate(row.lastActive)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="k-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-purple">{t.recentStudentReviewsHeading}</h2>
            <Link href="/admin/reviews" className="text-sm font-medium text-barbie">
              {t.viewAll}
            </Link>
          </div>
          <ul className="mt-3 space-y-3">
            {reviews.length ? (
              reviews.map((r) => (
                <li key={r.id}>
                  <Link href="/admin/reviews" className="block rounded-lg hover:bg-ivory">
                    <p className="font-medium text-plum">{store.users.find((u) => u.id === r.userId)?.name}</p>
                    <p className="text-sm text-muted">
                      {r.category} · {r.rating}/5 · {formatDate(r.createdAt)}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-plum">{r.message}</p>
                  </Link>
                </li>
              ))
            ) : (
              <li className="text-sm text-muted">{t.noReviewsSubmittedYet}</li>
            )}
          </ul>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Link href="/admin/mentors" className="k-card p-5">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-purple">{t.mentorPerformanceTitle}</h2>
          <p className="mt-2 text-sm text-muted">{t.mentorPerformanceCardSubtitle}</p>
          <p className="mt-3 text-sm font-medium text-barbie">{t.openMentorAnalysisLink}</p>
        </Link>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/admin/matching" className="k-card p-5">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-purple">{t.collaboratorMatchingTitle}</h2>
            <p className="mt-2 text-sm text-muted">{t.pairComplementarySkillsHint}</p>
          </Link>
          <Link href="/admin/volunteer-applications" className="k-card p-5">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-purple">{t.volunteerApplicationsTitle}</h2>
            <p className="mt-2 text-2xl font-semibold text-plum">{pendingVolunteers}</p>
            <p className="text-sm text-muted">{t.pendingReviewWord}</p>
          </Link>
        </div>
      </section>

      <Dialog open={activeOpen} title={t.activeStudentsThisMonthLabel} onClose={() => setActiveOpen(false)}>
        <p className="text-sm text-muted">
          {formatT(t.activeStudentsDialogExplain, { active: month.active.length, total: month.total, pct: month.pct })}
        </p>
        <ul className="mt-3 divide-y divide-line text-sm">
          {students.map((p) => {
            const u = store.users.find((x) => x.id === p.userId);
            const { completed, total, pct } = completionForStudent(store.enrollments, p.userId);
            const isActive = month.active.some((a) => a.userId === p.userId);
            return (
              <li key={p.userId} className="py-2">
                <Link href={`/admin/students/${p.userId}`} className="font-medium text-plum hover:text-barbie">
                  {u?.name}
                </Link>
                <p className="text-muted">
                  {isActive ? t.activeThisMonthColonLabel : t.notActiveThisMonthLabel}
                  {" · "}
                  {t.lastWord} {formatDate(p.lastActiveAt)} · {completed}/{total} {t.completeWord} ({pct}%) · {t.streakWordColon} {p.streak} · {p.xp} XP · L{levelFromXp(p.xp).level}
                </p>
              </li>
            );
          })}
        </ul>
      </Dialog>
    </div>
  );
}
