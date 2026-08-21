const Enrollment = require('../models/Enrollment');
const Activity = require('../models/Activity');
const StudentAchievement = require('../models/StudentAchievement');
const Notification = require('../models/Notification');
const Achievement = require('../models/Achievement');

const getEnrollments = async (studentId = null, query = {}) => {
  const filter = {};
  if (studentId) filter.studentId = studentId;
  if (query.status) filter.status = query.status;
  if (query.activityId) filter.activityId = query.activityId;

  return Enrollment.find(filter).sort({ updatedAt: -1 });
};

const enroll = async (activityId, studentId) => {
  const activity = await Activity.findById(activityId);
  if (!activity) {
    const error = new Error('Activity not found');
    error.statusCode = 404;
    throw error;
  }

  let enrollment = await Enrollment.findOne({ activityId, studentId });
  if (enrollment) {
    return enrollment;
  }

  enrollment = await Enrollment.create({
    activityId,
    studentId,
    status: 'not_started',
    progress: 0,
    startedAt: null
  });

  // Check if first enrollment achievement needed
  const totalEnrollments = await Enrollment.countDocuments({ studentId });
  if (totalEnrollments === 1) {
    let firstStepAch = await Achievement.findOne({ key: 'first_step' });
    const achId = firstStepAch ? firstStepAch.id : 'ach-first';

    const alreadyUnlocked = await StudentAchievement.findOne({
      studentId,
      achievementId: achId
    });

    if (!alreadyUnlocked) {
      await StudentAchievement.create({
        studentId,
        achievementId: achId,
        unlockedAt: new Date()
      });

      await Notification.create({
        audience: 'student',
        userId: studentId,
        title: 'First Step',
        body: 'You enrolled in your first activity.',
        kind: 'achievement',
        read: false
      });
    }
  }

  return enrollment;
};

const startActivity = async (activityId, studentId) => {
  let enrollment = await Enrollment.findOne({ activityId, studentId });

  if (!enrollment) {
    enrollment = await Enrollment.create({
      activityId,
      studentId,
      status: 'in_progress',
      progress: 15,
      startedAt: new Date()
    });
  } else {
    enrollment.status = 'in_progress';
    enrollment.progress = Math.max(enrollment.progress, 15);
    if (!enrollment.startedAt) {
      enrollment.startedAt = new Date();
    }
    await enrollment.save();
  }

  return enrollment;
};

const getEnrollment = async (activityId, studentId) => {
  const enrollment = await Enrollment.findOne({ activityId, studentId });
  if (!enrollment) {
    return {
      activityId,
      studentId,
      status: 'not_started',
      progress: 0
    };
  }
  return enrollment;
};

module.exports = {
  getEnrollments,
  enroll,
  startActivity,
  getEnrollment
};
