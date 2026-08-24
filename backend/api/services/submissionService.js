const Submission = require('../models/Submission');
const Enrollment = require('../models/Enrollment');
const Activity = require('../models/Activity');
const StudentProfile = require('../models/StudentProfile');
const XPTransaction = require('../models/XPTransaction');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sanitizeAndValidateInput, GuardrailError } = require('./ai/inputGuard');
const { scoreSubmission, AiJudgeError } = require('./ai/aiJudgeService');
const { getEffectiveRubric } = require('./ai/rubrics');
const { computeXp } = require('./ai/computeXp');

/**
 * Runs the AI Judge on a submission's latest attempt and stores the result
 * as a suggestion for the human reviewer - never awaited by the request
 * that triggers it (see submitWork below), per KATALYST_AI_SPEC.md §2.1:
 * the Judge is a backend job, not something a browser click waits on.
 * Failures are stored on the submission (aiSuggestion.error) rather than
 * thrown - this must never crash the request path that kicked it off.
 */
async function triggerAiJudge(submissionId, activity, attemptText) {
  try {
    const guard = sanitizeAndValidateInput(attemptText, { maxLen: 20000 });
    if (guard.blockedReason) {
      await Submission.findByIdAndUpdate(submissionId, {
        aiSuggestion: { error: `blocked_by_guardrail: ${guard.blockedReason}`, generatedAt: new Date() }
      });
      return;
    }

    const criteria = getEffectiveRubric(activity);
    const result = await scoreSubmission(
      guard.clean,
      criteria.map((c) => ({ key: c.key, name: c.name, weightPct: c.weight_pct, description: c.description }))
    );

    const xp = computeXp(criteria, result.criteria_levels, activity.xpReward || 0);
    const criteriaByKey = new Map(criteria.map((c) => [c.key, c]));

    await Submission.findByIdAndUpdate(submissionId, {
      aiSuggestion: {
        suggestedScore: Math.round(xp.totalEarnedPct),
        suggestedFeedback: result.student_feedback,
        criteriaLevels: xp.criteriaLevels.map((l) => ({
          criterionKey: l.criterionKey,
          criterionName: criteriaByKey.get(l.criterionKey)?.name || l.criterionKey,
          levelKey: l.levelKey,
          weightPct: l.weightPct,
          earnedPct: l.earnedPct,
          justification: l.justification
        })),
        confidence: result.confidence,
        flags: result.flags,
        generatedAt: new Date()
      }
    });
  } catch (err) {
    const message =
      err instanceof GuardrailError || err instanceof AiJudgeError ? err.message : 'AI Judge failed unexpectedly';
    console.error('AI Judge auto-scoring failed:', err);
    await Submission.findByIdAndUpdate(submissionId, {
      aiSuggestion: { error: message, generatedAt: new Date() }
    }).catch(() => {});
  }
}

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

  // Fire-and-forget: the reviewing admin doesn't need to wait on this, and
  // per KATALYST_AI_SPEC.md §2.1 it must never be something a submit click
  // blocks on. Deliberately not awaited or returned - see triggerAiJudge.
  triggerAiJudge(submission.id, activity, attempt.text).catch((err) => {
    console.error('triggerAiJudge threw unexpectedly (should be unreachable - it catches internally):', err);
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
