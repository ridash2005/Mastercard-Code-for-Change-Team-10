import type { Activity, Enrollment, StudentProfile, Submission, User } from "@/lib/types";

/**
 * Repository layer. UI should call these helpers (or the Zustand store which
 * implements the same mutations) so Mongo can replace the mock later.
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
