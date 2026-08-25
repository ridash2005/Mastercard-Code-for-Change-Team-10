"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, ApiError, type TeamWithMembers } from "@/lib/services/api";
import type {
  Achievement,
  Activity,
  ActivityType,
  AdminProfile,
  AppNotification,
  Certificate,
  Complaint,
  Difficulty,
  Enrollment,
  EnrollmentStatus,
  ExtracurricularActivity,
  FeedbackRecord,
  CollaborationInvite,
  Mission,
  StudentAchievement,
  VolunteerApplication,
  Participation,
  Requirement,
  StudentProfile,
  Submission,
  User,
  XPTransaction,
} from "@/lib/types";

export type PlatformState = {
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  hydrating: boolean;
  /** Fetches this session's real data from backend/api and populates the
   * store. Call once sessionUserId is known (see components/providers.tsx).
   * Safe to call repeatedly - e.g. after a mutation, to refresh from the
   * source of truth instead of hand-rolling every local update. */
  hydrate: () => Promise<void>;
  sessionUserId: string | null;
  setSession: (user: User) => void;
  clearSession: () => void;
  users: User[];
  studentProfiles: StudentProfile[];
  adminProfiles: AdminProfile[];
  activities: Activity[];
  enrollments: Enrollment[];
  submissions: Submission[];
  achievements: Achievement[];
  studentAchievements: StudentAchievement[];
  missions: Mission[];
  /** Real, role-agnostic rankings with names already joined server-side -
   * prefer this over deriving from studentProfiles/users, which (by
   * design - see backend/api's privacy-scoped routes) a student session
   * only has for themselves, not their peers. */
  leaderboard: { userId: string; name: string; xp: number; rank: number }[];
  teams: TeamWithMembers[];
  xpTransactions: XPTransaction[];
  notifications: AppNotification[];
  complaints: Complaint[];
  feedbackRecords: FeedbackRecord[];
  certificates: Certificate[];
  extracurricular: ExtracurricularActivity[];
  meetings: { id: string; title: string; scheduledAt: string; reschedulable?: boolean; candidateSlots?: string[]; [k: string]: unknown }[];
  collaborations: CollaborationInvite[];
  volunteerApplications: VolunteerApplication[];
  updateProfile: (
    userId: string,
    patch: {
      name?: string;
      skills?: string[];
      interests?: string[];
      careerGoal?: string;
      onboarded?: boolean;
      notificationPreferences?: { emailNotificationsEnabled?: boolean; courseRecommendationEmails?: boolean; meetingUpdateEmails?: boolean };
    },
  ) => Promise<void>;
  enroll: (activityId: string, studentId?: string) => Promise<void>;
  startActivity: (activityId: string, studentId?: string) => Promise<void>;
  submitWork: (input: {
    activityId: string;
    studentId?: string;
    text: string;
    link: string;
    notes: string;
    fileName?: string;
  }) => Promise<void>;
  createActivity: (activity: Omit<Activity, "id" | "createdBy"> & { createdBy?: string }) => Promise<string | null>;
  reviewSubmission: (input: {
    submissionId: string;
    reviewerId?: string;
    action: "approve" | "reject" | "resubmit";
    score: number;
    feedback: string;
  }) => Promise<void>;
  addFeedback: (record: Omit<FeedbackRecord, "id" | "createdAt">) => Promise<void>;
  addComplaint: (record: Omit<Complaint, "id" | "createdAt" | "status">) => Promise<void>;
  addContact: (name: string, email: string, category: string, message: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  /** meetingId, not activityId - backend/api's reschedule is a Meeting
   * resource, distinct from Activity. See lib/services/api.ts's meetings. */
  reschedule: (meetingId: string, slot: string) => Promise<void>;
  createCollaboration: (input: { studentIds: string[]; projectTitle: string; adminRationale: string }) => Promise<void>;
  respondCollaboration: (id: string, studentId: string, status: "accepted" | "declined") => Promise<void>;
  reviewVolunteer: (id: string, status: "approved" | "rejected") => Promise<void>;
};

const empty = {
  hydrating: false,
  sessionUserId: null as string | null,
  users: [] as User[],
  studentProfiles: [] as StudentProfile[],
  adminProfiles: [] as AdminProfile[],
  activities: [] as Activity[],
  enrollments: [] as Enrollment[],
  submissions: [] as Submission[],
  achievements: [] as Achievement[],
  studentAchievements: [] as StudentAchievement[],
  missions: [] as Mission[],
  leaderboard: [] as PlatformState["leaderboard"],
  teams: [] as TeamWithMembers[],
  xpTransactions: [] as XPTransaction[],
  notifications: [] as AppNotification[],
  complaints: [] as Complaint[],
  feedbackRecords: [] as FeedbackRecord[],
  certificates: [] as Certificate[],
  extracurricular: [] as ExtracurricularActivity[],
  meetings: [] as PlatformState["meetings"],
  collaborations: [] as CollaborationInvite[],
  volunteerApplications: [] as VolunteerApplication[],
};

/** Best-effort - a single failed call (e.g. a 403 on an admin-only endpoint
 * for a student session) shouldn't blank out everything else that loaded
 * fine, so failures degrade to "leave that slice empty" rather than
 * throwing. */
async function settle<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch (err) {
    if (!(err instanceof ApiError)) console.error(err);
    return null;
  }
}

export const usePlatform = create<PlatformState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      ...empty,
      setHydrated: (v) => set({ hydrated: v }),
      setSession: (user) => {
        set((s) => ({
          sessionUserId: user.id,
          users: [user, ...s.users.filter((u) => u.id !== user.id)],
        }));
      },
      clearSession: () => {
        set({ ...empty, sessionUserId: null });
      },
      hydrate: async () => {
        const sid = get().sessionUserId;
        if (!sid) return;
        set({ hydrating: true });

        const isAdmin = get().users.find((u) => u.id === sid)?.role === "admin";

        const [
          activities,
          enrollments,
          submissions,
          notifications,
          teams,
          certificates,
          extracurricular,
          complaints,
          feedbackRecords,
          meetings,
          missions,
          xpTransactions,
          gamAchievements,
          leaderboard,
          collaborations,
          volunteerApplications,
          ownProfile,
          allUsers,
          reports,
        ] = await Promise.all([
          settle(api.activities.list()),
          settle(api.enrollments.list()),
          settle(api.submissions.list()),
          settle(api.notifications.list()),
          settle(api.teams.list()),
          settle(api.certificates.list()),
          settle(api.extracurricular.list()),
          settle(api.complaints.list()),
          settle(api.feedback.list()),
          settle(api.meetings.list()),
          settle(api.gamification.missions()),
          settle(api.gamification.xpTransactions()),
          settle(api.gamification.achievements()),
          settle(api.gamification.leaderboard()),
          settle(api.collaborations.list()),
          isAdmin ? settle(api.volunteerApplications.list()) : Promise.resolve(null),
          settle(api.users.profile()),
          isAdmin ? settle(api.users.list()) : Promise.resolve(null),
          isAdmin ? settle(api.analytics.reports()) : Promise.resolve(null),
        ]);

        const gamList = (gamAchievements ?? []) as { id: string; key: string; title: string; description: string; unlocked?: boolean; unlockedAt?: string | null }[];
        const achievements = gamList.map(({ id, key, title, description }) => ({ id, key, title, description }));
        const studentAchievements = gamList
          .filter((a) => a.unlocked)
          .map((a) => ({ studentId: sid, achievementId: a.id, unlockedAt: a.unlockedAt ?? new Date().toISOString() }));

        set((s) => {
          const patch: Partial<PlatformState> = { hydrating: false };
          if (activities) patch.activities = activities;
          if (enrollments) patch.enrollments = enrollments;
          if (submissions) patch.submissions = submissions;
          if (notifications) patch.notifications = notifications;
          if (teams) patch.teams = teams;
          if (certificates) patch.certificates = certificates;
          if (extracurricular) patch.extracurricular = extracurricular;
          if (complaints) patch.complaints = complaints;
          if (feedbackRecords) patch.feedbackRecords = feedbackRecords;
          if (meetings) patch.meetings = meetings;
          if (missions) patch.missions = missions as Mission[];
          if (leaderboard) patch.leaderboard = leaderboard;
          if (collaborations) patch.collaborations = collaborations;
          if (volunteerApplications) patch.volunteerApplications = volunteerApplications;
          if (xpTransactions) patch.xpTransactions = xpTransactions as XPTransaction[];
          if (gamAchievements) {
            patch.achievements = achievements as Achievement[];
            patch.studentAchievements = studentAchievements as StudentAchievement[];
          }
          if (allUsers) patch.users = allUsers;
          if (ownProfile) {
            patch.studentProfiles = [
              ownProfile.profile,
              ...s.studentProfiles.filter((p) => p.userId !== sid),
            ].filter((p): p is StudentProfile => p != null);
            if (!allUsers) patch.users = [ownProfile.user, ...s.users.filter((u) => u.id !== sid)];
          }
          if (reports) {
            // Admin-only combined roster - backfills studentProfiles for
            // every fellow (not just the admin's own, which they don't
            // have). Fields the report doesn't carry (skills, interests,
            // teamId, ...) default empty; only /api/users/profile (self)
            // has those, per backend/api's privacy-scoped routes.
            const fromReports: StudentProfile[] = (
              reports as { studentId: string; xp: number; streak: number; atRisk: boolean; inactive: boolean }[]
            ).map((r) => ({
              userId: r.studentId,
              skills: [],
              interests: [],
              careerGoal: "",
              xp: r.xp,
              streak: r.streak,
              lastActiveAt: new Date().toISOString(),
              teamId: null,
              completedCourseIds: [],
              inactive: r.inactive,
              atRisk: r.atRisk,
              onboarded: true,
            }));
            const own = patch.studentProfiles ?? s.studentProfiles;
            patch.studentProfiles = [...own.filter((p) => fromReports.every((r) => r.userId !== p.userId)), ...fromReports];
          }
          return patch;
        });
      },
      updateProfile: async (_userId, patch) => {
        const result = await settle(api.users.updateProfile(patch));
        if (!result) return;
        set((s) => ({
          users: s.users.map((u) => (u.id === result.user.id ? result.user : u)),
          studentProfiles: result.profile
            ? [result.profile, ...s.studentProfiles.filter((p) => p.userId !== result.profile!.userId)]
            : s.studentProfiles,
        }));
      },
      enroll: async (activityId) => {
        const exists = get().enrollments.some((e) => e.activityId === activityId);
        if (exists) return;
        const enrollment = await settle(api.enrollments.enroll(activityId));
        if (!enrollment) return;
        set((s) => ({ enrollments: [...s.enrollments, enrollment] }));
        void get().hydrate(); // picks up the "first enrollment" achievement + notification
      },
      startActivity: async (activityId) => {
        const enrollment = await settle(api.enrollments.start(activityId));
        if (!enrollment) return;
        set((s) => ({
          enrollments: s.enrollments.map((e) => (e.activityId === activityId ? enrollment : e)),
        }));
      },
      submitWork: async (input) => {
        const submission = await settle(
          api.submissions.submit({
            activityId: input.activityId,
            text: input.text,
            link: input.link,
            notes: input.notes,
            fileName: input.fileName,
          }),
        );
        if (!submission) return;
        set((s) => {
          const existing = s.submissions.find((sub) => sub.id === submission.id);
          return {
            submissions: existing
              ? s.submissions.map((sub) => (sub.id === submission.id ? submission : sub))
              : [...s.submissions, submission],
            enrollments: s.enrollments.map((e) =>
              e.activityId === input.activityId ? { ...e, status: submission.status, progress: 80 } : e,
            ),
          };
        });
      },
      createActivity: async (activity) => {
        const created = await settle(api.activities.create(activity));
        if (!created) return null;
        set((s) => ({ activities: [created, ...s.activities] }));
        return created.id;
      },
      reviewSubmission: async ({ submissionId, action, score, feedback }) => {
        const submission = await settle(api.submissions.review(submissionId, { action, score, feedback }));
        if (!submission) return;
        set((s) => ({
          submissions: s.submissions.map((item) => (item.id === submissionId ? submission : item)),
        }));
        void get().hydrate(); // picks up XP/enrollment/certificate/notification side effects
      },
      addFeedback: async (record) => {
        const created = await settle(api.feedback.create(record));
        if (!created) return;
        set((s) => ({ feedbackRecords: [created, ...s.feedbackRecords] }));
      },
      addComplaint: async (record) => {
        const created = await settle(api.complaints.create(record));
        if (!created) return;
        set((s) => ({ complaints: [created, ...s.complaints] }));
      },
      addContact: async (name, email, category, message) => {
        await settle(api.contact.submit({ name, email, category, message }));
      },
      markNotificationRead: async (id) => {
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
        await settle(api.notifications.markRead(id));
      },
      reschedule: async (meetingId, slot) => {
        const ok = await settle(api.meetings.reschedule(meetingId, slot));
        if (ok === null) return;
        void get().hydrate();
      },
      createCollaboration: async ({ studentIds, projectTitle, adminRationale }) => {
        const created = await settle(api.collaborations.create({ studentIds, projectTitle, adminRationale }));
        if (!created) return;
        set((s) => ({ collaborations: [created, ...s.collaborations] }));
      },
      respondCollaboration: async (id, _studentId, status) => {
        const updated = await settle(api.collaborations.respond(id, status));
        if (!updated) return;
        set((s) => ({ collaborations: s.collaborations.map((c) => (c.id === id ? updated : c)) }));
      },
      reviewVolunteer: async (id, status) => {
        const updated = await settle(api.volunteerApplications.updateStatus(id, status));
        if (!updated) return;
        set((s) => ({ volunteerApplications: s.volunteerApplications.map((v) => (v.id === id ? updated : v)) }));
      },
    }),
    {
      name: "katalyst-platform",
      skipHydration: true,
      // Only the session id is worth persisting across reloads - everything
      // else is refetched live from backend/api on each hydrate() and would
      // otherwise go stale in localStorage.
      partialize: (s) => ({ sessionUserId: s.sessionUserId }),
    },
  ),
);

export function filterActivities(
  list: Activity[],
  q: {
    search?: string;
    type?: ActivityType | "all";
    domain?: string;
    problemDomain?: string;
    difficulty?: Difficulty | "all";
    xpMin?: number;
    requirement?: Requirement | "all";
    certificate?: "all" | "yes" | "no";
    participation?: Participation | "all";
    due?: "all" | "week" | "month" | "overdue";
    status?: EnrollmentStatus | "all";
    enrollments?: Enrollment[];
    studentId?: string;
  },
) {
  const search = q.search?.trim().toLowerCase() ?? "";
  return list.filter((a) => {
    if (search && !`${a.title} ${a.description} ${a.category}`.toLowerCase().includes(search)) return false;
    if (q.type && q.type !== "all" && a.type !== q.type) return false;
    if (q.domain && q.domain !== "all" && a.domain !== q.domain) return false;
    if (q.problemDomain && q.problemDomain !== "all" && a.problemDomain !== q.problemDomain) return false;
    if (q.difficulty && q.difficulty !== "all" && a.difficulty !== q.difficulty) return false;
    if (typeof q.xpMin === "number" && a.xpReward < q.xpMin) return false;
    if (q.requirement && q.requirement !== "all" && a.requirement !== q.requirement) return false;
    if (q.certificate === "yes" && !a.certificate) return false;
    if (q.certificate === "no" && a.certificate) return false;
    if (q.participation && q.participation !== "all" && a.participation !== q.participation) return false;
    if (q.due && q.due !== "all") {
      const d = new Date(a.dueDate).getTime();
      const now = Date.now();
      if (q.due === "overdue" && d >= now) return false;
      if (q.due === "week" && (d < now || d > now + 7 * 86400000)) return false;
      if (q.due === "month" && (d < now || d > now + 30 * 86400000)) return false;
    }
    if (q.status && q.status !== "all" && q.enrollments && q.studentId) {
      const st = q.enrollments.find((e) => e.activityId === a.id && e.studentId === q.studentId)?.status ?? "not_started";
      if (st !== q.status) return false;
    }
    return true;
  });
}

export type FilterQuery = Parameters<typeof filterActivities>[1];
