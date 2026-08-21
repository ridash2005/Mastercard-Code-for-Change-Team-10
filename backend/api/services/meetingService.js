const Meeting = require('../models/Meeting');
const Notification = require('../models/Notification');
const User = require('../models/User');

const getMeetings = async (studentId = null, query = {}) => {
  const filter = {};
  if (studentId) filter.studentId = studentId;
  if (query.status) filter.status = query.status;

  return Meeting.find(filter).sort({ scheduledAt: 1 });
};

const getMeetingById = async (id) => {
  const meeting = await Meeting.findById(id);
  if (!meeting) {
    const error = new Error('Meeting not found');
    error.statusCode = 404;
    throw error;
  }
  return meeting;
};

const createMeeting = async (data) => {
  const meeting = await Meeting.create(data);

  // Notify student
  await Notification.create({
    audience: 'student',
    userId: meeting.studentId,
    title: 'New Session Scheduled',
    body: `You have a new session scheduled: ${meeting.title} on ${new Date(meeting.scheduledAt).toLocaleString('en-IN')}`,
    kind: 'deadline',
    read: false
  });

  return meeting;
};

const updateMeeting = async (id, data) => {
  const meeting = await Meeting.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!meeting) {
    const error = new Error('Meeting not found');
    error.statusCode = 404;
    throw error;
  }
  return meeting;
};

const deleteMeeting = async (id) => {
  const meeting = await Meeting.findByIdAndDelete(id);
  if (!meeting) {
    const error = new Error('Meeting not found');
    error.statusCode = 404;
    throw error;
  }
  return meeting;
};

const rescheduleMeeting = async (meetingId, studentId, slot) => {
  const meeting = await Meeting.findById(meetingId);
  if (!meeting) {
    const error = new Error('Meeting not found');
    error.statusCode = 404;
    throw error;
  }

  if (!meeting.reschedulable) {
    const error = new Error('This meeting cannot be rescheduled');
    error.statusCode = 400;
    throw error;
  }

  // Check deadline if set
  if (meeting.rescheduleDeadline && new Date() > new Date(meeting.rescheduleDeadline)) {
    const error = new Error('Reschedule deadline has passed');
    error.statusCode = 409;
    throw error;
  }

  const oldSlot = meeting.scheduledAt;
  meeting.scheduledAt = new Date(slot);
  meeting.status = 'rescheduled';
  await meeting.save();

  const student = await User.findById(studentId);

  // Send notifications
  await Notification.create({
    audience: 'student',
    userId: studentId,
    title: 'Session moved',
    body: `New slot ${new Date(slot).toLocaleString('en-IN')}. Staff have been notified.`,
    kind: 'reschedule',
    read: false
  });

  await Notification.create({
    audience: 'admin',
    title: 'Reschedule request',
    body: `${student?.name || 'Student'} moved session '${meeting.title}' to ${new Date(slot).toLocaleString('en-IN')}.`,
    kind: 'review',
    read: false
  });

  return meeting;
};

module.exports = {
  getMeetings,
  getMeetingById,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  rescheduleMeeting
};
