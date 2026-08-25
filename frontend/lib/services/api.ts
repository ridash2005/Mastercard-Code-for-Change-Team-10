"use client";

// Typed client for backend/api's real REST surface, called from the browser
// via the same-origin proxy at app/api/backend/[...path]/route.ts (which
// attaches the session's JWT server-side - the browser never sees it).
// This is what lib/data/platform-store.ts's actions call instead of
// mutating local mock arrays.

import type {
  Activity,
  AppNotification,
  Certificate,
  CollaborationInvite,
  Complaint,
  Enrollment,
  ExtracurricularActivity,
  FeedbackRecord,
  StudentProfile,
  Submission,
  Team,
  TeamRole,
  User,
  VolunteerApplication,
} from "@/lib/types";

export type TeamWithMembers = Team & {
  members: { teamId: string; studentId: string; role: TeamRole; contribution: number; student: User | null }[];
};

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly reason?: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/backend/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.success === false) {
    throw new ApiError(body?.message ?? `Request failed (${res.status})`, res.status, body?.reason);
  }
  return body.data as T;
}

const get = <T,>(path: string) => request<T>(path, { method: "GET" });
const post = <T,>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
const put = <T,>(path: string, body?: unknown) =>
  request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined });
const patch = <T,>(path: string, body?: unknown) =>
  request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined });
const del = <T,>(path: string) => request<T>(path, { method: "DELETE" });

// backend/api's dashboard payload is intentionally not fully modeled here -
// see services/gamificationService.js's getDashboard for the authoritative
// shape (user, profile, gamification{xp,level,...}, continueActivities,
// upcomingDeadlines, recommendations, topLeaderboard, achievements, team).
// Consumers destructure only what they need.
export type GamificationDashboard = Record<string, unknown>;

export const api = {
  users: {
    profile: () => get<{ user: User; profile: StudentProfile | null }>("users/profile"),
    updateProfile: (patch: {
      name?: string;
      skills?: string[];
      interests?: string[];
      careerGoal?: string;
      notificationPreferences?: { emailNotificationsEnabled?: boolean; courseRecommendationEmails?: boolean; meetingUpdateEmails?: boolean };
    }) => {
      const { notificationPreferences, ...rest } = patch;
      return put<{ user: User; profile: StudentProfile | null }>("users/profile", {
        ...rest,
        // backend/api's updateProfile only reads notificationPreferences
        // when nested under studentProfile - see services/userService.js.
        ...(notificationPreferences && { studentProfile: { notificationPreferences } }),
      });
    },
    list: () => get<User[]>("users"),
    atRisk: () => get<StudentProfile[]>("users/students/at-risk"),
  },
  activities: {
    list: (query?: Record<string, string | undefined>) => {
      const qs = query
        ? "?" + new URLSearchParams(Object.entries(query).filter(([, v]) => v) as [string, string][]).toString()
        : "";
      return get<Activity[]>(`activities${qs}`);
    },
    get: (id: string) => get<Activity>(`activities/${id}`),
    create: (data: Omit<Activity, "id" | "createdBy">) => post<Activity>("activities", data),
    update: (id: string, data: Partial<Activity>) => put<Activity>(`activities/${id}`, data),
    remove: (id: string) => del<void>(`activities/${id}`),
  },
  enrollments: {
    list: () => get<Enrollment[]>("enrollments"),
    get: (activityId: string) => get<Enrollment>(`enrollments/${activityId}`),
    enroll: (activityId: string) => post<Enrollment>("enrollments", { activityId }),
    start: (activityId: string) => patch<Enrollment>(`enrollments/${activityId}/start`),
  },
  submissions: {
    list: () => get<Submission[]>("submissions"),
    get: (id: string) => get<Submission>(`submissions/${id}`),
    submit: (data: { activityId: string; text: string; link: string; notes: string; fileName?: string }) =>
      post<Submission>("submissions", data),
    review: (
      id: string,
      data: { action: "approve" | "reject" | "resubmit"; score: number; feedback: string }
    ) => post<Submission>(`submissions/${id}/review`, data),
  },
  meetings: {
    list: () => get<{ id: string; title: string; scheduledAt: string; [k: string]: unknown }[]>("meetings"),
    reschedule: (id: string, slot: string) => post<unknown>(`meetings/${id}/reschedule`, { slot }),
  },
  gamification: {
    dashboard: () => get<GamificationDashboard>("gamification/dashboard"),
    leaderboard: () => get<{ userId: string; name: string; xp: number; rank: number }[]>("gamification/leaderboard"),
    achievements: () => get<unknown[]>("gamification/achievements"),
    missions: () => get<unknown[]>("gamification/missions"),
    xpTransactions: () => get<unknown[]>("gamification/xp-transactions"),
  },
  teams: {
    list: () => get<TeamWithMembers[]>("teams"),
    get: (id: string) => get<TeamWithMembers>(`teams/${id}`),
  },
  notifications: {
    list: () => get<AppNotification[]>("notifications"),
    markRead: (id: string) => patch<void>(`notifications/${id}/read`),
    markAllRead: () => patch<void>("notifications/read-all"),
  },
  feedback: {
    list: () => get<FeedbackRecord[]>("feedback"),
    create: (data: { category: string; rating: number; message: string; activityId?: string }) =>
      post<FeedbackRecord>("feedback", data),
  },
  complaints: {
    list: () => get<Complaint[]>("complaints"),
    create: (data: { category: string; subject: string; description: string; priority: string; attachmentName?: string }) =>
      post<Complaint>("complaints", data),
    updateStatus: (id: string, status: string) => patch<Complaint>(`complaints/${id}/status`, { status }),
  },
  certificates: {
    list: () => get<Certificate[]>("certificates"),
    get: (id: string) => get<Certificate>(`certificates/${id}`),
    /** Same-origin URL for an `<a href download>` - the proxy attaches auth server-side. */
    downloadUrl: (id: string) => `/api/backend/certificates/${id}/download`,
  },
  extracurricular: {
    list: () => get<ExtracurricularActivity[]>("extracurricular"),
    get: (id: string) => get<ExtracurricularActivity>(`extracurricular/${id}`),
    create: (data: Omit<ExtracurricularActivity, "id">) => post<ExtracurricularActivity>("extracurricular", data),
  },
  contact: {
    submit: (data: { name: string; email: string; category: string; message: string }) =>
      post<void>("contact", data),
  },
  analytics: {
    overview: () => get<unknown>("admin/analytics/overview"),
    reports: () => get<unknown>("admin/analytics/reports"),
  },
  collaborations: {
    list: () => get<CollaborationInvite[]>("collaborations"),
    create: (data: { studentIds: string[]; projectTitle: string; adminRationale: string }) =>
      post<CollaborationInvite>("collaborations", data),
    respond: (id: string, status: "accepted" | "declined") =>
      post<CollaborationInvite>(`collaborations/${id}/respond`, { status }),
  },
  volunteerApplications: {
    list: () => get<VolunteerApplication[]>("volunteer-applications"),
    create: (data: { name: string; email: string; interests: string[]; skills: string[]; college?: string; message?: string }) =>
      post<VolunteerApplication>("volunteer-applications", data),
    updateStatus: (id: string, status: "approved" | "rejected") =>
      patch<VolunteerApplication>(`volunteer-applications/${id}/status`, { status }),
  },
};
