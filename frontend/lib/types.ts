export type Role = "student" | "admin";

export type ActivityType =
  | "course"
  | "training"
  | "mentoring"
  | "project"
  | "assignment"
  | "milestone";

export type Difficulty = "beginner" | "intermediate" | "advanced";
export type Participation = "individual" | "team";
export type Requirement = "mandatory" | "optional";

export type EnrollmentStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "under_review"
  | "approved"
  | "needs_resubmission"
  | "completed";

export type ComplaintStatus = "submitted" | "under_review" | "in_progress" | "resolved";
export type ComplaintPriority = "low" | "medium" | "high";

export type TeamRole =
  | "Frontend Developer"
  | "Backend Developer"
  | "Database Developer"
  | "QA Engineer"
  | "Product Analyst";

export type Domain =
  | "Software Engineering"
  | "Data & AI"
  | "Product"
  | "Payments & Trust"
  | "Communication"
  | "Leadership";

export type ProblemDomain =
  | "Financial Inclusion"
  | "Digital Payments"
  | "Cybersecurity"
  | "Women in STEM"
  | "Campus Employability"
  | "Climate & Cities";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  college: string;
  programme: string;
  avatar: string;
  createdAt: string;
};

export type StudentProfile = {
  userId: string;
  skills: string[];
  interests: string[];
  careerGoal: string;
  xp: number;
  streak: number;
  lastActiveAt: string;
  teamId: string | null;
  completedCourseIds: string[];
  inactive: boolean;
  atRisk: boolean;
  onboarded: boolean;
};

export type AdminProfile = {
  userId: string;
  department: string;
  title: string;
};

export type Activity = {
  id: string;
  title: string;
  description: string;
  type: ActivityType;
  domain: Domain;
  problemDomain: ProblemDomain;
  category: string;
  difficulty: Difficulty;
  xpReward: number;
  startDate: string;
  dueDate: string;
  durationHours: number;
  requirement: Requirement;
  certificate: boolean;
  participation: Participation;
  attachments: { name: string; url: string }[];
  instructions: string;
  createdBy: string;
};

export type Course = Activity & { modules: string[] };
export type TrainingSession = Activity & { location: string; slots: string[] };
export type MentoringSession = Activity & { mentor: string; slots: string[] };
export type Project = Activity & { repoHint: string };
export type Assignment = Activity & { maxScore: number };
export type Milestone = Activity & { checkpoint: string };

export type Enrollment = {
  id: string;
  activityId: string;
  studentId: string;
  status: EnrollmentStatus;
  progress: number;
  startedAt?: string;
  completedAt?: string;
};

export type SubmissionAttempt = {
  id: string;
  submittedAt: string;
  text: string;
  link: string;
  notes: string;
  fileName?: string;
};

export type Submission = {
  id: string;
  activityId: string;
  studentId: string;
  enrollmentId: string;
  status: EnrollmentStatus;
  attempts: SubmissionAttempt[];
  score?: number;
  feedback?: string;
  xpAwarded: number;
  reviewedAt?: string;
  reviewerId?: string;
};

export type FeedbackRecord = {
  id: string;
  userId: string;
  category: string;
  rating: number;
  message: string;
  createdAt: string;
  activityId?: string;
};

export type Achievement = {
  id: string;
  key: string;
  title: string;
  description: string;
};

export type StudentAchievement = {
  studentId: string;
  achievementId: string;
  unlockedAt: string;
};

export type Mission = {
  id: string;
  title: string;
  description: string;
  target: number;
  unit: "activities" | "xp" | "projects";
  period: "week" | "month" | "open";
};

export type Team = {
  id: string;
  name: string;
  projectTitle: string;
  rank: number;
};

export type TeamMember = {
  teamId: string;
  studentId: string;
  role: TeamRole;
  contribution: number;
};

export type XPTransaction = {
  id: string;
  studentId: string;
  amount: number;
  reason: string;
  activityId?: string;
  createdAt: string;
};

export type AppNotification = {
  id: string;
  audience: "student" | "admin";
  userId?: string;
  title: string;
  body: string;
  kind:
    | "deadline"
    | "feedback"
    | "xp"
    | "achievement"
    | "team"
    | "streak"
    | "reschedule"
    | "ai"
    | "review"
    | "overdue"
    | "risk"
    | "participation";
  read: boolean;
  createdAt: string;
};

export type Complaint = {
  id: string;
  userId: string;
  category: string;
  subject: string;
  description: string;
  priority: ComplaintPriority;
  attachmentName?: string;
  status: ComplaintStatus;
  createdAt: string;
};

export type Certificate = {
  id: string;
  studentId: string;
  activityId: string;
  title: string;
  issuedAt: string;
};

export type ExtracurricularActivity = {
  id: string;
  title: string;
  kind:
    | "club"
    | "competition"
    | "volunteering"
    | "leadership"
    | "sports"
    | "cultural"
    | "hackathon"
    | "public_speaking";
  description: string;
  xpReward: number;
  date: string;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  category: string;
  message: string;
  createdAt: string;
};

export type CollaborationResponse = {
  studentId: string;
  status: "pending" | "accepted" | "declined";
};

export type CollaborationInvite = {
  id: string;
  studentIds: string[];
  projectTitle: string;
  adminRationale: string;
  studentMessage: string;
  createdAt: string;
  responses: CollaborationResponse[];
};

export type VolunteerApplication = {
  id: string;
  name: string;
  email: string;
  interests: string[];
  skills: string[];
  college?: string;
  message?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};
