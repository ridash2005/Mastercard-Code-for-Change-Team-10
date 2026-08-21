import mongoose, { Schema } from "mongoose";

const activityFields = {
  title: String,
  description: String,
  type: String,
  domain: String,
  problemDomain: String,
  category: String,
  difficulty: String,
  xpReward: Number,
  startDate: Date,
  dueDate: Date,
  durationHours: Number,
  requirement: String,
  certificate: Boolean,
  participation: String,
  attachments: [{ name: String, url: String }],
  instructions: String,
  createdBy: Schema.Types.ObjectId,
};

function modelOf(name: string, schema: Schema) {
  return mongoose.models[name] || mongoose.model(name, schema);
}

export const UserModel = modelOf(
  "User",
  new Schema(
    {
      name: String,
      email: { type: String, unique: true },
      role: { type: String, enum: ["student", "admin"] },
      college: String,
      programme: String,
      avatar: String,
    },
    { timestamps: true },
  ),
);
export const StudentProfileModel = modelOf(
  "StudentProfile",
  new Schema({
    userId: Schema.Types.ObjectId,
    skills: [String],
    interests: [String],
    careerGoal: String,
    xp: Number,
    streak: Number,
    lastActiveAt: Date,
    teamId: Schema.Types.ObjectId,
    completedCourseIds: [String],
    inactive: Boolean,
    atRisk: Boolean,
    onboarded: Boolean,
  }),
);
export const AdminProfileModel = modelOf(
  "AdminProfile",
  new Schema({ userId: Schema.Types.ObjectId, department: String, title: String }),
);
export const ActivityModel = modelOf("Activity", new Schema(activityFields));
export const CourseModel = modelOf("Course", new Schema({ ...activityFields, modules: [String] }));
export const TrainingSessionModel = modelOf(
  "TrainingSession",
  new Schema({ ...activityFields, location: String, slots: [Date] }),
);
export const MentoringSessionModel = modelOf(
  "MentoringSession",
  new Schema({ ...activityFields, mentor: String, slots: [Date] }),
);
export const ProjectModel = modelOf("Project", new Schema({ ...activityFields, repoHint: String }));
export const AssignmentModel = modelOf("Assignment", new Schema({ ...activityFields, maxScore: Number }));
export const MilestoneModel = modelOf("Milestone", new Schema({ ...activityFields, checkpoint: String }));
export const SubmissionModel = modelOf(
  "Submission",
  new Schema({
    activityId: Schema.Types.ObjectId,
    studentId: Schema.Types.ObjectId,
    enrollmentId: String,
    status: String,
    attempts: [{ submittedAt: Date, text: String, link: String, notes: String, fileName: String }],
    score: Number,
    feedback: String,
    xpAwarded: Number,
    reviewedAt: Date,
    reviewerId: Schema.Types.ObjectId,
  }),
);
export const FeedbackModel = modelOf(
  "Feedback",
  new Schema({ userId: Schema.Types.ObjectId, category: String, rating: Number, message: String }),
);
export const AchievementModel = modelOf("Achievement", new Schema({ key: String, title: String, description: String }));
export const MissionModel = modelOf(
  "Mission",
  new Schema({ title: String, description: String, target: Number, unit: String, period: String }),
);
export const TeamModel = modelOf("Team", new Schema({ name: String, projectTitle: String, rank: Number }));
export const TeamMemberModel = modelOf(
  "TeamMember",
  new Schema({
    teamId: Schema.Types.ObjectId,
    studentId: Schema.Types.ObjectId,
    role: String,
    contribution: Number,
  }),
);
export const XPTransactionModel = modelOf(
  "XPTransaction",
  new Schema({
    studentId: Schema.Types.ObjectId,
    amount: Number,
    reason: String,
    activityId: Schema.Types.ObjectId,
  }),
);
export const NotificationModel = modelOf(
  "Notification",
  new Schema({
    audience: String,
    userId: Schema.Types.ObjectId,
    title: String,
    body: String,
    kind: String,
    read: Boolean,
  }),
);
export const ComplaintModel = modelOf(
  "Complaint",
  new Schema({
    userId: Schema.Types.ObjectId,
    category: String,
    subject: String,
    description: String,
    priority: String,
    attachmentName: String,
    status: String,
  }),
);
export const CertificateModel = modelOf(
  "Certificate",
  new Schema({
    studentId: Schema.Types.ObjectId,
    activityId: Schema.Types.ObjectId,
    title: String,
    issuedAt: Date,
  }),
);
export const ExtracurricularActivityModel = modelOf(
  "ExtracurricularActivity",
  new Schema({
    title: String,
    kind: String,
    description: String,
    xpReward: Number,
    date: Date,
  }),
);
