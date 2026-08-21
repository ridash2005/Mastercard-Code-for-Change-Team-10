const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Notification = require('../models/Notification');

const getComplaints = async (userId = null) => {
  const filter = {};
  if (userId) filter.userId = userId;

  const complaints = await Complaint.find(filter).sort({ createdAt: -1 });
  const userIds = [...new Set(complaints.map((c) => c.userId))];
  const users = await User.find({ _id: { $in: userIds } });
  const userMap = new Map(users.map((u) => [u.id, u]));

  return complaints.map((c) => ({
    ...c.toJSON(),
    user: userMap.get(c.userId) || null
  }));
};

const createComplaint = async (data, userId) => {
  const complaint = await Complaint.create({
    ...data,
    userId,
    status: 'submitted'
  });

  const user = await User.findById(userId);

  // Notify admin
  await Notification.create({
    audience: 'admin',
    title: `New Grievance · ${complaint.category}`,
    body: `${user?.name || 'Student'}: ${complaint.subject}`,
    kind: 'review',
    read: false
  });

  return complaint;
};

const updateComplaintStatus = async (id, status) => {
  const complaint = await Complaint.findByIdAndUpdate(id, { status }, { new: true });
  if (!complaint) {
    const error = new Error('Complaint not found');
    error.statusCode = 404;
    throw error;
  }

  // Notify student
  await Notification.create({
    audience: 'student',
    userId: complaint.userId,
    title: 'Grievance Update',
    body: `Your complaint '${complaint.subject}' status updated to ${status}.`,
    kind: 'feedback',
    read: false
  });

  return complaint;
};

module.exports = {
  getComplaints,
  createComplaint,
  updateComplaintStatus
};
