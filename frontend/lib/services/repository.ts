import type { Activity, Enrollment, StudentProfile, Submission, User } from "@/lib/types";

/**
 * Small, pure lookup/derive helpers over the arrays lib/data/platform-store.ts
 * hydrates from backend/api's real data - kept separate from the store so
 * they're trivially unit-testable and reusable across pages.
 */
export function getStudent(users: User[], profiles: StudentProfile[], id: string) {
  return {
    user: users.find((u) => u.id === id),
    profile: profiles.find((p) => p.userId === id),
  };
}

export function enrollmentFor(enrollments: Enrollment[], activityId: string, studentId: string) {
  return enrollments.find((e) => e.activityId === activityId && e.studentId === studentId);
}

export function submissionsFor(submissions: Submission[], studentId: string) {
  return submissions.filter((s) => s.studentId === studentId);
}

export function activitiesByType(activities: Activity[], type: Activity["type"]) {
  return activities.filter((a) => a.type === type);
}

export function globalRanks(profiles: StudentProfile[]) {
  return [...profiles].sort((a, b) => b.xp - a.xp).map((p, i) => ({ ...p, rank: i + 1 }));
}
