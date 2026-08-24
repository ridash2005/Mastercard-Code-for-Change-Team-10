import type { Activity, ActivityType, Enrollment, EnrollmentStatus, StudentProfile, User } from "@/lib/types";

const DONE: EnrollmentStatus[] = ["completed", "approved"];
const OPEN: EnrollmentStatus[] = ["in_progress", "submitted", "under_review", "needs_resubmission"];

export function isDone(status: EnrollmentStatus) {
  return DONE.includes(status);
}

export function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function activeThisMonth(profiles: StudentProfile[], now = new Date()) {
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const active = profiles.filter((p) => !p.inactive && monthKey(p.lastActiveAt) === key);
  const inactive = profiles.filter((p) => !active.includes(p));
  return { active, inactive, total: profiles.length, pct: profiles.length ? Math.round((active.length / profiles.length) * 100) : 0 };
}

export function completionForStudent(enrollments: Enrollment[], studentId: string) {
  const mine = enrollments.filter((e) => e.studentId === studentId);
  const completed = mine.filter((e) => isDone(e.status)).length;
  const inProgress = mine.filter((e) => OPEN.includes(e.status)).length;
  const pct = mine.length ? Math.round((completed / mine.length) * 100) : 0;
  return { mine, completed, inProgress, total: mine.length, pct };
}

export function completionByType(
  enrollments: Enrollment[],
  activities: Activity[],
  studentId: string,
  types: ActivityType[] = ["course", "training", "mentoring", "project", "assignment", "milestone"],
) {
  return types.map((type) => {
    const ids = new Set(activities.filter((a) => a.type === type).map((a) => a.id));
    const mine = enrollments.filter((e) => e.studentId === studentId && ids.has(e.activityId));
    const completed = mine.filter((e) => isDone(e.status)).length;
    return {
      type,
      completed,
      total: mine.length,
      pct: mine.length ? Math.round((completed / mine.length) * 100) : 0,
    };
  });
}

export function overdueForStudent(enrollments: Enrollment[], activities: Activity[], studentId: string, today = "2026-08-21") {
  return activities.filter((a) => {
    const en = enrollments.find((e) => e.studentId === studentId && e.activityId === a.id);
    if (!en || isDone(en.status)) return false;
    return a.dueDate < today;
  });
}

export function upcomingForStudent(enrollments: Enrollment[], activities: Activity[], studentId: string, today = "2026-08-21") {
  return activities.filter((a) => {
    const en = enrollments.find((e) => e.studentId === studentId && e.activityId === a.id);
    if (!en || isDone(en.status)) return false;
    return a.dueDate >= today;
  });
}

export function attentionRows(
  profiles: StudentProfile[],
  users: User[],
  enrollments: Enrollment[],
  activities: Activity[],
) {
  const rows: { userId: string; name: string; reason: string; metric: string; lastActive: string; href: string }[] = [];
  for (const p of profiles) {
    const name = users.find((u) => u.id === p.userId)?.name ?? p.userId;
    const { pct, total } = completionForStudent(enrollments, p.userId);
    const overdue = overdueForStudent(enrollments, activities, p.userId);
    if (p.atRisk) {
      rows.push({
        userId: p.userId,
        name,
        reason: "Flagged at-risk",
        metric: p.inactive ? "Inactive" : `${pct}% complete`,
        lastActive: p.lastActiveAt,
        href: `/admin/students/${p.userId}`,
      });
      continue;
    }
    if (p.inactive) {
      rows.push({
        userId: p.userId,
        name,
        reason: "Inactive",
        metric: `Streak ${p.streak}`,
        lastActive: p.lastActiveAt,
        href: `/admin/students/${p.userId}`,
      });
      continue;
    }
    if (overdue.length) {
      rows.push({
        userId: p.userId,
        name,
        reason: "Overdue activities",
        metric: `${overdue.length} overdue`,
        lastActive: p.lastActiveAt,
        href: `/admin/students/${p.userId}`,
      });
      continue;
    }
    if (total > 0 && pct < 50) {
      rows.push({
        userId: p.userId,
        name,
        reason: "Low activity completion",
        metric: `${pct}% complete`,
        lastActive: p.lastActiveAt,
        href: `/admin/students/${p.userId}`,
      });
    }
  }
  return rows;
}
