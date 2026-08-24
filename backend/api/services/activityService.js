const Activity = require('../models/Activity');
const Enrollment = require('../models/Enrollment');
const Notification = require('../models/Notification');

const listActivities = async (query = {}, user = null) => {
  const {
    search,
    type,
    domain,
    problemDomain,
    difficulty,
    xpMin,
    requirement,
    certificate,
    participation,
    due,
    status
  } = query;

  const isAdmin = user?.role === 'admin';
  const studentId = user && !isAdmin ? user._id.toString() : null;

  const mongoQuery = {};

  // Drafts (e.g. a student-suggested course pending review - see
  // services/chatbotActionService.js) never appear in the public/student
  // catalog. Admins see everything so they have something to review.
  if (!isAdmin) {
    mongoQuery.status = { $ne: 'draft' };
  }

  if (type && type !== 'all') {
    mongoQuery.type = type;
  }
  if (domain && domain !== 'all') {
    mongoQuery.domain = domain;
  }
  if (problemDomain && problemDomain !== 'all') {
    mongoQuery.problemDomain = problemDomain;
  }
  if (difficulty && difficulty !== 'all') {
    mongoQuery.difficulty = difficulty;
  }
  if (requirement && requirement !== 'all') {
    mongoQuery.requirement = requirement;
  }
  if (certificate === 'yes') {
    mongoQuery.certificate = true;
  } else if (certificate === 'no') {
    mongoQuery.certificate = false;
  }
  if (participation && participation !== 'all') {
    mongoQuery.participation = participation;
  }
  if (xpMin) {
    mongoQuery.xpReward = { $gte: Number(xpMin) };
  }

  if (search) {
    mongoQuery.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } }
    ];
  }

  let activities = await Activity.find(mongoQuery).sort({ createdAt: -1 });

  // Due date filtering
  if (due && due !== 'all') {
    const now = Date.now();
    activities = activities.filter((a) => {
      const d = new Date(a.dueDate).getTime();
      if (due === 'overdue') return d < now;
      if (due === 'week') return d >= now && d <= now + 7 * 86400000;
      if (due === 'month') return d >= now && d <= now + 30 * 86400000;
      return true;
    });
  }

  // If studentId provided, attach enrollment status
  let enrollments = [];
  if (studentId) {
    enrollments = await Enrollment.find({ studentId });
    const enrollmentMap = new Map(enrollments.map((e) => [e.activityId, e.status]));

    if (status && status !== 'all') {
      activities = activities.filter((a) => {
        const st = enrollmentMap.get(a.id) || 'not_started';
        return st === status;
      });
    }

    return activities.map((a) => {
      const obj = a.toJSON();
      obj.enrollmentStatus = enrollmentMap.get(a.id) || 'not_started';
      return obj;
    });
  }

  return activities.map((a) => a.toJSON());
};

const getActivityById = async (id, user = null) => {
  let activity = await Activity.findById(id);
  if (!activity) {
    // Try by custom string id if mongo ObjectId fails
    activity = await Activity.findOne({ _id: id });
  }

  if (!activity) {
    const error = new Error('Activity not found');
    error.statusCode = 404;
    throw error;
  }

  const isAdmin = user?.role === 'admin';
  const isOwner = user && activity.createdBy === user._id.toString();
  if (activity.status === 'draft' && !isAdmin && !isOwner) {
    const error = new Error('Activity not found');
    error.statusCode = 404;
    throw error;
  }

  const studentId = user && !isAdmin ? user._id.toString() : null;
  const result = activity.toJSON();
  if (studentId) {
    const enrollment = await Enrollment.findOne({ activityId: activity.id, studentId });
    result.enrollmentStatus = enrollment ? enrollment.status : 'not_started';
  }

  return result;
};

const createActivity = async (data, creatorId = null) => {
  const activityData = {
    ...data,
    createdBy: creatorId || data.createdBy
  };

  const activity = await Activity.create(activityData);

  // Create broadcast notification for students
  await Notification.create({
    audience: 'student',
    title: 'New activity',
    body: `${activity.title} is now on Explore.`,
    kind: 'ai',
    read: false
  });

  return activity;
};

const updateActivity = async (id, data) => {
  const activity = await Activity.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!activity) {
    const error = new Error('Activity not found');
    error.statusCode = 404;
    throw error;
  }
  return activity;
};

const deleteActivity = async (id) => {
  const activity = await Activity.findByIdAndDelete(id);
  if (!activity) {
    const error = new Error('Activity not found');
    error.statusCode = 404;
    throw error;
  }
  return activity;
};

module.exports = {
  listActivities,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity
};
