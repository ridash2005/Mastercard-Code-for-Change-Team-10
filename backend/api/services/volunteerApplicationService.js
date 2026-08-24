const VolunteerApplication = require('../models/VolunteerApplication');
const Notification = require('../models/Notification');

const getApplications = async (query = {}) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  return VolunteerApplication.find(filter).sort({ createdAt: -1 });
};

const createApplication = async (data) => {
  const application = await VolunteerApplication.create({ ...data, status: 'pending' });

  await Notification.create({
    audience: 'admin',
    title: 'New volunteer application',
    body: `${application.name} applied to volunteer.`,
    kind: 'review',
    read: false
  });

  return application;
};

const updateApplicationStatus = async (id, status) => {
  const application = await VolunteerApplication.findByIdAndUpdate(id, { status }, { new: true });
  if (!application) {
    const error = new Error('Volunteer application not found');
    error.statusCode = 404;
    throw error;
  }
  return application;
};

module.exports = { getApplications, createApplication, updateApplicationStatus };
