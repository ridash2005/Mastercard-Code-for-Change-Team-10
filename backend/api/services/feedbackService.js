const Feedback = require('../models/Feedback');
const User = require('../models/User');

const getFeedbacks = async (userId = null) => {
  const filter = {};
  if (userId) filter.userId = userId;

  const feedbacks = await Feedback.find(filter).sort({ createdAt: -1 });
  const userIds = [...new Set(feedbacks.map((f) => f.userId))];
  const users = await User.find({ _id: { $in: userIds } });
  const userMap = new Map(users.map((u) => [u.id, u]));

  return feedbacks.map((f) => ({
    ...f.toJSON(),
    user: userMap.get(f.userId) || null
  }));
};

const createFeedback = async (data, userId) => {
  const feedback = await Feedback.create({
    ...data,
    userId
  });
  return feedback;
};

module.exports = {
  getFeedbacks,
  createFeedback
};
