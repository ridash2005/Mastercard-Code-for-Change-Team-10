"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardCard } from "@/components/cards";
import { DonutChart } from "@/components/admin/charts";
import { Dialog } from "@/components/ui/dialog";
import { usePlatform } from "@/lib/data/platform-store";
import { activeThisMonth, attentionRows, completionForStudent } from "@/lib/admin/insights";
import { formatDate, levelFromXp } from "@/lib/utils";

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
  return (
    <Link href={href} className="block rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-barbie">
      <DashboardCard label={label} value={value} hint={hint} />
      <span className="sr-only">Open {label}</span>
    </Link>
  );
}

export default function AdminHome() {
  const store = usePlatform();
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
        <h1 className="font-serif text-3xl">Programme dashboard</h1>
        <p className="mt-1 text-sm text-muted">Actionable programme operations — every panel opens a working view.</p>
      </div>

      <section>
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-purple">Overview</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricLink href="/admin/students" label="Students" value={students.length} hint="Open directory" />
          <MetricLink href="/admin/students" label="Active" value={month.active.length} hint="This month" />
          <MetricLink href="/admin/completion" label="Completion rate" value={`${rate}%`} hint="By enrolment" />
          <MetricLink href="/admin/activities" label="Activities" value={store.activities.length} hint="Catalogue" />
          <MetricLink href="/admin/submissions" label="Pending reviews" value={pending} hint="Review queue" />
          <MetricLink href="/admin/leaderboards" label="Average XP" value={avgXp} hint="Leaderboard" />
          <MetricLink href="/admin/escalations" label="Overdue activities" value={overdue} hint="Escalations" />
          <MetricLink href="/admin/attention" label="At-risk students" value={atRisk} hint="Needs attention" />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <h2 className="sr-only">Engagement</h2>
        <button
          type="button"
          onClick={() => setActiveOpen(true)}
          className="k-card p-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-barbie"
        >
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-purple">Active students this month</p>
          <div className="mt-3 flex flex-wrap items-center gap-6">
            <DonutChart
              value={month.active.length}
              total={month.total}
              label={`${month.active.length} of ${month.total} students active this month, ${month.pct} percent`}
            />
            <div className="text-sm">
              <p className="text-plum">
                Active this month: <strong>{month.active.length} / {month.total}</strong>
              </p>
              <p className="mt-1 text-muted">{month.pct}% active · {month.inactive.length} not active this month</p>
              <p className="mt-3 font-medium text-barbie">View student activity →</p>
            </div>
          </div>
        </button>
        <Link href="/admin/completion" className="k-card p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-barbie">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-purple">Activity completion by student</p>
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
          <p className="mt-3 text-sm font-medium text-barbie">Open completion detail →</p>
        </Link>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="k-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-purple">Students requiring attention</h2>
            <Link href="/admin/attention" className="text-sm font-medium text-barbie">
              View all
            </Link>
          </div>
          <ul className="mt-3 space-y-3">
            {attention.map((row) => (
              <li key={row.userId}>
                <Link href={row.href} className="block rounded-lg hover:bg-ivory">
                  <p className="font-medium text-plum">{row.name}</p>
                  <p className="text-sm text-muted">
                    {row.reason} · {row.metric} · last {formatDate(row.lastActive)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="k-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-purple">Recent student reviews</h2>
            <Link href="/admin/reviews" className="text-sm font-medium text-barbie">
              View all
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
              <li className="text-sm text-muted">No reviews submitted yet.</li>
            )}
          </ul>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Link href="/admin/mentors" className="k-card p-5">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-purple">Mentor performance</h2>
          <p className="mt-2 text-sm text-muted">Ratings come only from student feedback tagged Mentoring. Session counts use mentoring enrolments.</p>
          <p className="mt-3 text-sm font-medium text-barbie">Open mentor analysis →</p>
        </Link>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/admin/matching" className="k-card p-5">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-purple">Collaborator matching</h2>
            <p className="mt-2 text-sm text-muted">Pair complementary skills for projects.</p>
          </Link>
          <Link href="/admin/volunteer-applications" className="k-card p-5">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-purple">Volunteer applications</h2>
            <p className="mt-2 text-2xl font-semibold text-plum">{pendingVolunteers}</p>
            <p className="text-sm text-muted">pending review</p>
          </Link>
        </div>
      </section>

      <Dialog open={activeOpen} title="Active students this month" onClose={() => setActiveOpen(false)}>
        <p className="text-sm text-muted">
          Active means last activity falls in the current month and the profile is not marked inactive. {month.active.length} of {month.total} ({month.pct}%).
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
                  {isActive ? "Active this month" : "Not active this month"}
                  {" · "}
                  last {formatDate(p.lastActiveAt)} · {completed}/{total} complete ({pct}%) · streak {p.streak} · {p.xp} XP · L{levelFromXp(p.xp).level}
                </p>
              </li>
            );
          })}
        </ul>
      </Dialog>
    </div>
  );
}
