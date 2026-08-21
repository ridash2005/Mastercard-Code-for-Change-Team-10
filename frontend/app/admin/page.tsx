"use client";

import { DashboardCard } from "@/components/cards";
import { usePlatform } from "@/lib/data/platform-store";
import Link from "next/link";

export default function AdminHome() {
  const store = usePlatform();
  const students = store.studentProfiles;
  const active = students.filter((s) => !s.inactive).length;
  const pending = store.submissions.filter((s) => s.status === "submitted" || s.status === "under_review").length;
  const avgXp = Math.round(students.reduce((a, s) => a + s.xp, 0) / students.length);
  const completedEn = store.enrollments.filter((e) => e.status === "completed" || e.status === "approved").length;
  const rate = store.enrollments.length ? Math.round((completedEn / store.enrollments.length) * 100) : 0;
  const overdue = store.activities.filter((a) => a.dueDate < "2026-08-21").length;
  const atRisk = students.filter((s) => s.atRisk).length;
  return (
    <div>
      <h1 className="font-serif text-3xl">Programme dashboard</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard label="Students" value={students.length} />
        <DashboardCard label="Active" value={active} />
        <DashboardCard label="Completion rate" value={`${rate}%`} />
        <DashboardCard label="Activities" value={store.activities.length} />
        <DashboardCard label="Pending reviews" value={pending} />
        <DashboardCard label="Average XP" value={avgXp} />
        <DashboardCard label="Overdue activities" value={overdue} />
        <DashboardCard label="At-risk students" value={atRisk} />
      </div>
      <p className="mt-6 text-sm">
        <Link className="underline" href="/admin/submissions">
          Review queue
        </Link>
        {" · "}
        <Link className="underline" href="/admin/activities/create">
          Create activity
        </Link>
      </p>
    </div>
  );
}
