const Submission = require('../models/Submission');
const Enrollment = require('../models/Enrollment');
const Activity = require('../models/Activity');
const StudentProfile = require('../models/StudentProfile');
const XPTransaction = require('../models/XPTransaction');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');
const User = require('../models/User');

const getSubmissions = async (studentId = null, query = {}) => {
  const filter = {};
  if (studentId) filter.studentId = studentId;
  if (query.status) filter.status = query.status;
  if (query.activityId) filter.activityId = query.activityId;

  const submissions = await Submission.find(filter).sort({ updatedAt: -1 });

  // Attach activity and student details for rich responses
  const activityIds = [...new Set(submissions.map((s) => s.activityId))];
  const studentIds = [...new Set(submissions.map((s) => s.studentId))];

  const [activities, users] = await Promise.all([
    Activity.find({ _id: { $in: activityIds } }),
    User.find({ _id: { $in: studentIds } })
  ]);

  const activityMap = new Map(activities.map((a) => [a.id, a]));
  const userMap = new Map(users.map((u) => [u.id, u]));

  return submissions.map((s) => {
    const obj = s.toJSON();
    obj.activity = activityMap.get(s.activityId) || null;
    obj.student = userMap.get(s.studentId) || null;
    return obj;
  });
};

const getSubmissionById = async (id) => {
  const submission = await Submission.findById(id);
  if (!submission) {
    const error = new Error('Submission not found');
    error.statusCode = 404;
    throw error;
  }

  const [activity, user] = await Promise.all([
    Activity.findById(submission.activityId),
    User.findById(submission.studentId)
  ]);

  const obj = submission.toJSON();
  obj.activity = activity;
  obj.student = user;
  return obj;
};

const submitWork = async (data) => {
  const { activityId, studentId, text, link, notes, fileName } = data;

  const activity = await Activity.findById(activityId);
  if (!activity) {
    const error = new Error('Activity not found');
    error.statusCode = 404;
    throw error;
  }

  let enrollment = await Enrollment.findOne({ activityId, studentId });
  if (!enrollment) {
    enrollment = await Enrollment.create({
      activityId,
      studentId,
      status: 'submitted',
      progress: 80,
      startedAt: new Date()
    });
  } else {
    enrollment.status = 'submitted';
    enrollment.progress = Math.max(enrollment.progress, 80);
    await enrollment.save();
  }

  const attempt = {
    submittedAt: new Date(),
    text: text || '',
    link: link || '',
    notes: notes || '',
    fileName: fileName || ''
  };

  let submission = await Submission.findOne({ activityId, studentId });
  if (submission) {
    submission.status = 'submitted';
    submission.attempts.push(attempt);
    await submission.save();
  } else {
    submission = await Submission.create({
      activityId,
      studentId,
      enrollmentId: enrollment.id,
      status: 'submitted',
      attempts: [attempt],
      xpAwarded: 0
    });
  }

  // Send admin notification
  const student = await User.findById(studentId);
  await Notification.create({
    audience: 'admin',
    title: 'New submission',
    body: `${student?.name || 'Student'} submitted work for ${activity.title}.`,
    kind: 'review',
    read: false
  });

  return submission;
};

const reviewSubmission = async ({ submissionId, reviewerId, action, score, feedback }) => {
  const submission = await Submission.findById(submissionId);
  if (!submission) {
    const error = new Error('Submission not found');
    error.statusCode = 404;
    throw error;
  }

  const activity = await Activity.findById(submission.activityId);
  const isApproved = action === 'approve';
  const isResubmit = action === 'resubmit';

  const newStatus = isApproved ? 'approved' : isResubmit ? 'needs_resubmission' : 'submitted';
  const xpToAward = isApproved ? activity?.xpReward || 0 : 0;

  submission.status = newStatus;
  submission.score = score;
  submission.feedback = feedback || '';
  submission.xpAwarded = xpToAward;
  submission.reviewedAt = new Date();
  submission.reviewerId = reviewerId;
  await submission.save();

  // Update enrollment
  const enrollment = await Enrollment.findOne({
    activityId: submission.activityId,
    studentId: submission.studentId
  });

  if (enrollment) {
    enrollment.status = isApproved ? 'completed' : newStatus;
    enrollment.progress = isApproved ? 100 : enrollment.progress;
    if (isApproved) enrollment.completedAt = new Date();
    await enrollment.save();
  }

  // If approved: update profile XP, completedCourseIds, XP transaction, certificate
  if (isApproved) {
    const profile = await StudentProfile.findOne({ userId: submission.studentId });
    if (profile) {
      profile.xp += xpToAward;
      profile.lastActiveAt = new Date();
      profile.atRisk = false;
      profile.inactive = false;

      if (activity?.type === 'course') {
        const completed = new Set(profile.completedCourseIds);
        completed.add(activity.id);
        profile.completedCourseIds = Array.from(completed);
      }
      await profile.save();
    }

    // Insert XP Transaction
    await XPTransaction.create({
      studentId: submission.studentId,
      amount: xpToAward,
      reason: `${activity?.title || 'Activity'} approved`,
      activityId: submission.activityId
    });

    // Create Certificate if eligible
    if (activity?.certificate) {
      await Certificate.findOneAndUpdate(
        { studentId: submission.studentId, activityId: activity.id },
        {
          studentId: submission.studentId,
          activityId: activity.id,
          title: activity.title,
          issuedAt: new Date()
        },
        { upsert: true, new: true }
      );
    }

    // Create student notifications
    await Notification.create({
      audience: 'student',
      userId: submission.studentId,
      title: `Approved · ${score}/100`,
      body: feedback || 'Great job on your submission!',
      kind: 'feedback',
      read: false
    });

    if (xpToAward > 0) {
      await Notification.create({
        audience: 'student',
        userId: submission.studentId,
        title: `+${xpToAward} XP`,
        body: `${activity?.title} is complete.`,
        kind: 'xp',
        read: false
      });
    }
  } else if (isResubmit) {
    await Notification.create({
      audience: 'student',
      userId: submission.studentId,
      title: 'Please resubmit',
      body: feedback || 'Please review the feedback and resubmit your work.',
      kind: 'feedback',
      read: false
    });
  }

  return submission;
};

module.exports = {
  getSubmissions,
  getSubmissionById,
  submitWork,
  reviewSubmission
};
