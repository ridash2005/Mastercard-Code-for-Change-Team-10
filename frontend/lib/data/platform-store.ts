"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as seed from "@/lib/data/seed";
import type {
  Activity,
  ActivityType,
  AppNotification,
  Complaint,
  Difficulty,
  Enrollment,
  EnrollmentStatus,
  FeedbackRecord,
  CollaborationInvite,
  VolunteerApplication,
  Participation,
  Requirement,
  Role,
  StudentProfile,
  Submission,
  User,
} from "@/lib/types";
import { uid } from "@/lib/utils";

export type PlatformState = {
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  sessionUserId: string | null;
  users: User[];
  studentProfiles: StudentProfile[];
  adminProfiles: typeof seed.adminProfiles;
  activities: Activity[];
  enrollments: Enrollment[];
  submissions: Submission[];
  achievements: typeof seed.achievements;
  studentAchievements: typeof seed.studentAchievements;
  missions: typeof seed.missions;
  teams: typeof seed.teams;
  teamMembers: typeof seed.teamMembers;
  xpTransactions: typeof seed.xpTransactions;
  notifications: AppNotification[];
  complaints: Complaint[];
  feedbackRecords: FeedbackRecord[];
  certificates: typeof seed.certificates;
  extracurricular: typeof seed.extracurricular;
  reschedules: { id: string; activityId: string; studentId: string; slot: string }[];
  collaborations: CollaborationInvite[];
  volunteerApplications: VolunteerApplication[];
  login: (email: string) => { ok: boolean; role?: Role; error?: string };
  logout: () => void;
  register: (input: {
    name: string;
    email: string;
    college: string;
    programme: string;
    role: Role;
  }) => { ok: boolean; error?: string };
  updateProfile: (
    userId: string,
    patch: { name?: string; skills?: string[]; interests?: string[]; onboarded?: boolean },
  ) => void;
  enroll: (activityId: string, studentId: string) => void;
  startActivity: (activityId: string, studentId: string) => void;
  submitWork: (input: {
    activityId: string;
    studentId: string;
    text: string;
    link: string;
    notes: string;
    fileName?: string;
  }) => void;
  createActivity: (activity: Omit<Activity, "id" | "createdBy"> & { createdBy?: string }) => string;
  reviewSubmission: (input: {
    submissionId: string;
    reviewerId: string;
    action: "approve" | "reject" | "resubmit";
    score: number;
    feedback: string;
  }) => void;
  addFeedback: (record: Omit<FeedbackRecord, "id" | "createdAt">) => void;
  addComplaint: (record: Omit<Complaint, "id" | "createdAt" | "status">) => void;
  addContact: (name: string, email: string, category: string, message: string) => void;
  markNotificationRead: (id: string) => void;
  reschedule: (activityId: string, studentId: string, slot: string) => void;
  createCollaboration: (input: { studentIds: string[]; projectTitle: string; adminRationale: string }) => void;
  respondCollaboration: (id: string, studentId: string, status: "accepted" | "declined") => void;
  reviewVolunteer: (id: string, status: "approved" | "rejected") => void;
};

const initial = {
  hydrated: false,
  sessionUserId: null as string | null,
  users: seed.users,
  studentProfiles: seed.studentProfiles,
  adminProfiles: seed.adminProfiles,
  activities: seed.activities,
  enrollments: seed.enrollments,
  submissions: seed.submissions,
  achievements: seed.achievements,
  studentAchievements: seed.studentAchievements,
  missions: seed.missions,
  teams: seed.teams,
  teamMembers: seed.teamMembers,
  xpTransactions: seed.xpTransactions,
  notifications: seed.notifications,
  complaints: seed.complaints,
  feedbackRecords: seed.feedbackRecords,
  certificates: seed.certificates,
  extracurricular: seed.extracurricular,
  reschedules: [] as PlatformState["reschedules"],
  collaborations: seed.collaborations,
  volunteerApplications: seed.volunteerApplications,
};

export const usePlatform = create<PlatformState>()(
  persist(
    (set, get) => ({
      ...initial,
      setHydrated: (v) => set({ hydrated: v }),
      login: (email) => {
        const user = get().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
        if (!user) return { ok: false, error: "No account for that email in this demo." };
        set({ sessionUserId: user.id });
        if (typeof document !== "undefined") {
          document.cookie = `katalyst-role=${user.role}; path=/; SameSite=Lax`;
          document.cookie = `katalyst-user=${user.id}; path=/; SameSite=Lax`;
        }
        return { ok: true, role: user.role };
      },
      logout: () => {
        set({ sessionUserId: null });
        if (typeof document !== "undefined") {
          document.cookie = "katalyst-role=; path=/; max-age=0";
          document.cookie = "katalyst-user=; path=/; max-age=0";
        }
      },
      register: (input) => {
        if (get().users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
          return { ok: false, error: "That email is already registered in this demo." };
        }
        const id = uid("u");
        const user: User = {
          id,
          name: input.name,
          email: input.email,
          role: input.role,
          college: input.college,
          programme: input.programme,
          avatar: input.name
            .split(" ")
            .map((p) => p[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          users: [...s.users, user],
          studentProfiles:
            input.role === "student"
              ? [
                  ...s.studentProfiles,
                  {
                    userId: id,
                    skills: [],
                    interests: [],
                    careerGoal: "",
                    xp: 0,
                    streak: 0,
                    lastActiveAt: new Date().toISOString(),
                    teamId: null,
                    completedCourseIds: [],
                    inactive: false,
                    atRisk: false,
                    onboarded: false,
                  },
                ]
              : s.studentProfiles,
          sessionUserId: id,
        }));
        if (typeof document !== "undefined") {
          document.cookie = `katalyst-role=${input.role}; path=/; SameSite=Lax`;
          document.cookie = `katalyst-user=${id}; path=/; SameSite=Lax`;
        }
        return { ok: true };
      },
      updateProfile: (userId, patch) => {
        set((s) => ({
          users: s.users.map((u) => (u.id === userId && patch.name ? { ...u, name: patch.name } : u)),
          studentProfiles: s.studentProfiles.map((p) =>
            p.userId === userId
              ? {
                  ...p,
                  skills: patch.skills ?? p.skills,
                  interests: patch.interests ?? p.interests,
                  onboarded: patch.onboarded ?? p.onboarded,
                }
              : p,
          ),
        }));
      },
      enroll: (activityId, studentId) => {
        const exists = get().enrollments.some((e) => e.activityId === activityId && e.studentId === studentId);
        if (exists) return;
        const enrollment: Enrollment = {
          id: uid("en"),
          activityId,
          studentId,
          status: "not_started",
          progress: 0,
        };
        const first = !get().studentAchievements.some(
          (a) => a.studentId === studentId && a.achievementId === "ach-first",
        );
        set((s) => ({
          enrollments: [...s.enrollments, enrollment],
          studentAchievements: first
            ? [...s.studentAchievements, { studentId, achievementId: "ach-first", unlockedAt: new Date().toISOString() }]
            : s.studentAchievements,
          notifications: first
            ? [
                {
                  id: uid("nt"),
                  audience: "student",
                  userId: studentId,
                  title: "First Step",
                  body: "You enrolled in your first activity.",
                  kind: "achievement",
                  read: false,
                  createdAt: new Date().toISOString(),
                },
                ...s.notifications,
              ]
            : s.notifications,
        }));
      },
      startActivity: (activityId, studentId) => {
        set((s) => ({
          enrollments: s.enrollments.map((e) =>
            e.activityId === activityId && e.studentId === studentId
              ? { ...e, status: "in_progress", progress: Math.max(e.progress, 15), startedAt: e.startedAt ?? new Date().toISOString() }
              : e,
          ),
        }));
      },
      submitWork: (input) => {
        const enrollment =
          get().enrollments.find((e) => e.activityId === input.activityId && e.studentId === input.studentId) ??
          ({
            id: uid("en"),
            activityId: input.activityId,
            studentId: input.studentId,
            status: "submitted" as EnrollmentStatus,
            progress: 80,
          } satisfies Enrollment);
        const attempt = {
          id: uid("att"),
          submittedAt: new Date().toISOString(),
          text: input.text,
          link: input.link,
          notes: input.notes,
          fileName: input.fileName,
        };
        set((s) => {
          const existing = s.submissions.find(
            (sub) => sub.activityId === input.activityId && sub.studentId === input.studentId,
          );
          const submissions = existing
            ? s.submissions.map((sub) =>
                sub.id === existing.id
                  ? { ...sub, status: "submitted" as EnrollmentStatus, attempts: [...sub.attempts, attempt] }
                  : sub,
              )
            : [
                ...s.submissions,
                {
                  id: uid("sub"),
                  activityId: input.activityId,
                  studentId: input.studentId,
                  enrollmentId: enrollment.id,
                  status: "submitted" as EnrollmentStatus,
                  attempts: [attempt],
                  xpAwarded: 0,
                },
              ];
          const hasEn = s.enrollments.some((e) => e.activityId === input.activityId && e.studentId === input.studentId);
          return {
            submissions,
            enrollments: hasEn
              ? s.enrollments.map((e) =>
                  e.activityId === input.activityId && e.studentId === input.studentId
                    ? { ...e, status: "submitted", progress: 80 }
                    : e,
                )
              : [...s.enrollments, { ...enrollment, status: "submitted", progress: 80 }],
            notifications: [
              {
                id: uid("nt"),
                audience: "admin",
                title: "New submission",
                body: `${s.users.find((u) => u.id === input.studentId)?.name ?? "Student"} submitted work.`,
                kind: "review",
                read: false,
                createdAt: new Date().toISOString(),
              },
              ...s.notifications,
            ],
          };
        });
      },
      createActivity: (activity) => {
        const id = uid("act");
        const created: Activity = {
          ...activity,
          id,
          createdBy: activity.createdBy ?? get().sessionUserId ?? "u-priya",
        };
        set((s) => ({
          activities: [created, ...s.activities],
          notifications: [
            {
              id: uid("nt"),
              audience: "student",
              title: "New activity",
              body: `${created.title} is now on Explore.`,
              kind: "ai",
              read: false,
              createdAt: new Date().toISOString(),
            },
            ...s.notifications,
          ],
        }));
        return id;
      },
      reviewSubmission: ({ submissionId, reviewerId, action, score, feedback }) => {
        const sub = get().submissions.find((s) => s.id === submissionId);
        if (!sub) return;
        const activity = get().activities.find((a) => a.id === sub.activityId);
        const status: EnrollmentStatus =
          action === "approve" ? "approved" : action === "resubmit" ? "needs_resubmission" : "submitted";
        const complete = action === "approve";
        const xp = complete ? activity?.xpReward ?? 0 : 0;
        set((s) => ({
          submissions: s.submissions.map((item) =>
            item.id === submissionId
              ? {
                  ...item,
                  status: complete ? "approved" : status,
                  score,
                  feedback,
                  xpAwarded: xp,
                  reviewedAt: new Date().toISOString(),
                  reviewerId,
                }
              : item,
          ),
          enrollments: s.enrollments.map((e) =>
            e.activityId === sub.activityId && e.studentId === sub.studentId
              ? {
                  ...e,
                  status: complete ? "completed" : status,
                  progress: complete ? 100 : e.progress,
                  completedAt: complete ? new Date().toISOString() : e.completedAt,
                }
              : e,
          ),
          studentProfiles: s.studentProfiles.map((p) =>
            p.userId === sub.studentId && complete
              ? {
                  ...p,
                  xp: p.xp + xp,
                  completedCourseIds:
                    activity?.type === "course" && !p.completedCourseIds.includes(activity.id)
                      ? [...p.completedCourseIds, activity.id]
                      : p.completedCourseIds,
                  lastActiveAt: new Date().toISOString(),
                  atRisk: false,
                  inactive: false,
                }
              : p,
          ),
          xpTransactions: complete
            ? [
                {
                  id: uid("xp"),
                  studentId: sub.studentId,
                  amount: xp,
                  reason: `${activity?.title ?? "Activity"} approved`,
                  activityId: sub.activityId,
                  createdAt: new Date().toISOString(),
                },
                ...s.xpTransactions,
              ]
            : s.xpTransactions,
          certificates:
            complete && activity?.certificate
              ? [
                  {
                    id: uid("cert"),
                    studentId: sub.studentId,
                    activityId: activity.id,
                    title: activity.title,
                    issuedAt: new Date().toISOString().slice(0, 10),
                  },
                  ...s.certificates,
                ]
              : s.certificates,
          notifications: [
            {
              id: uid("nt"),
              audience: "student",
              userId: sub.studentId,
              title: complete ? `Approved · ${score}` : action === "resubmit" ? "Please resubmit" : "Review update",
              body: feedback,
              kind: "feedback",
              read: false,
              createdAt: new Date().toISOString(),
            },
            ...(complete
              ? [
                  {
                    id: uid("nt"),
                    audience: "student" as const,
                    userId: sub.studentId,
                    title: `+${xp} XP`,
                    body: `${activity?.title} is complete.`,
                    kind: "xp" as const,
                    read: false,
                    createdAt: new Date().toISOString(),
                  },
                ]
              : []),
            ...s.notifications,
          ],
        }));
      },
      addFeedback: (record) => {
        set((s) => ({
          feedbackRecords: [
            { ...record, id: uid("fb"), createdAt: new Date().toISOString() },
            ...s.feedbackRecords,
          ],
        }));
      },
      addComplaint: (record) => {
        set((s) => ({
          complaints: [
            { ...record, id: uid("cp"), createdAt: new Date().toISOString(), status: "submitted" },
            ...s.complaints,
          ],
        }));
      },
      addContact: (name, email, category, message) => {
        set((s) => ({
          notifications: [
            {
              id: uid("nt"),
              audience: "admin",
              title: `Contact · ${category}`,
              body: `${name} (${email}): ${message.slice(0, 140)}`,
              kind: "review",
              read: false,
              createdAt: new Date().toISOString(),
            },
            ...s.notifications,
          ],
        }));
      },
      markNotificationRead: (id) => {
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }));
      },
      reschedule: (activityId, studentId, slot) => {
        set((s) => ({
          reschedules: [...s.reschedules, { id: uid("rs"), activityId, studentId, slot }],
          notifications: [
            {
              id: uid("nt"),
              audience: "student",
              userId: studentId,
              title: "Session moved",
              body: `New slot ${new Date(slot).toLocaleString("en-IN")}. Staff have been notified.`,
              kind: "reschedule",
              read: false,
              createdAt: new Date().toISOString(),
            },
            {
              id: uid("nt"),
              audience: "admin",
              title: "Reschedule request",
              body: `${s.users.find((u) => u.id === studentId)?.name} moved a session.`,
              kind: "review",
              read: false,
              createdAt: new Date().toISOString(),
            },
            ...s.notifications,
          ],
        }));
      },
      createCollaboration: ({ studentIds, projectTitle, adminRationale }) => {
        const invite: CollaborationInvite = {
          id: uid("col"),
          studentIds,
          projectTitle,
          adminRationale,
          studentMessage: "Your skill sets complement each other.",
          createdAt: new Date().toISOString(),
          responses: studentIds.map((studentId) => ({ studentId, status: "pending" })),
        };
        set((s) => ({
          collaborations: [invite, ...(s.collaborations ?? [])],
          notifications: [
            ...studentIds.map((userId) => ({
              id: uid("nt"),
              audience: "student" as const,
              userId,
              title: "New collaborator request",
              body: `You've been matched with a new collaborator for ${projectTitle}.`,
              kind: "team" as const,
              read: false,
              createdAt: new Date().toISOString(),
            })),
            ...s.notifications,
          ],
        }));
      },
      respondCollaboration: (id, studentId, status) => {
        set((s) => ({
          collaborations: (s.collaborations ?? []).map((c) =>
            c.id === id
              ? {
                  ...c,
                  responses: c.responses.map((r) => (r.studentId === studentId ? { ...r, status } : r)),
                }
              : c,
          ),
        }));
      },
      reviewVolunteer: (id, status) => {
        set((s) => ({
          volunteerApplications: (s.volunteerApplications ?? []).map((v) => (v.id === id ? { ...v, status } : v)),
        }));
      },
    }),
    {
      name: "katalyst-platform",
      skipHydration: true,
      partialize: (s) => ({
        sessionUserId: s.sessionUserId,
        users: s.users,
        studentProfiles: s.studentProfiles,
        adminProfiles: s.adminProfiles,
        activities: s.activities,
        enrollments: s.enrollments,
        submissions: s.submissions,
        achievements: s.achievements,
        studentAchievements: s.studentAchievements,
        missions: s.missions,
        teams: s.teams,
        teamMembers: s.teamMembers,
        xpTransactions: s.xpTransactions,
        notifications: s.notifications,
        complaints: s.complaints,
        feedbackRecords: s.feedbackRecords,
        certificates: s.certificates,
        extracurricular: s.extracurricular,
        reschedules: s.reschedules,
        collaborations: s.collaborations,
        volunteerApplications: s.volunteerApplications,
      }),
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
