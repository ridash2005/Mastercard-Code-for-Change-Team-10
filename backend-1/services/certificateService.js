const Certificate = require('../models/Certificate');
const Activity = require('../models/Activity');
const User = require('../models/User');

const getCertificates = async (studentId = null) => {
  const filter = {};
  if (studentId) filter.studentId = studentId;

  const certs = await Certificate.find(filter).sort({ issuedAt: -1 });
  const activityIds = certs.map((c) => c.activityId);
  const studentIds = certs.map((c) => c.studentId);

  const [activities, users] = await Promise.all([
    Activity.find({ _id: { $in: activityIds } }),
    User.find({ _id: { $in: studentIds } })
  ]);

  const activityMap = new Map(activities.map((a) => [a.id, a]));
  const userMap = new Map(users.map((u) => [u.id, u]));

  return certs.map((c) => ({
    ...c.toJSON(),
    activity: activityMap.get(c.activityId) || null,
    student: userMap.get(c.studentId) || null
  }));
};

const getCertificateById = async (id) => {
  const cert = await Certificate.findById(id);
  if (!cert) {
    const error = new Error('Certificate not found');
    error.statusCode = 404;
    throw error;
  }

  const [activity, user] = await Promise.all([
    Activity.findById(cert.activityId),
    User.findById(cert.studentId)
  ]);

  return {
    ...cert.toJSON(),
    activity,
    student: user
  };
};

module.exports = {
  getCertificates,
  getCertificateById
};
