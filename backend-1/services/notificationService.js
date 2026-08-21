const Notification = require('../models/Notification');

const getNotifications = async (user) => {
  let query = {};
  if (user.role === 'admin') {
    query = { audience: 'admin' };
  } else {
    query = {
      $or: [
        { audience: 'student', userId: user._id.toString() },
        { audience: 'student', userId: null }
      ]
    };
  }

  return Notification.find(query).sort({ createdAt: -1 });
};

const markAsRead = async (id) => {
  const notification = await Notification.findByIdAndUpdate(
    id,
    { read: true },
    { new: true }
  );
  if (!notification) {
    const error = new Error('Notification not found');
    error.statusCode = 404;
    throw error;
  }
  return notification;
};

const markAllAsRead = async (user) => {
  let query = {};
  if (user.role === 'admin') {
    query = { audience: 'admin' };
  } else {
    query = {
      $or: [
        { audience: 'student', userId: user._id.toString() },
        { audience: 'student', userId: null }
      ]
    };
  }

  await Notification.updateMany(query, { read: true });
  return { success: true };
};

const createNotification = async (data) => {
  return Notification.create(data);
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification
};
