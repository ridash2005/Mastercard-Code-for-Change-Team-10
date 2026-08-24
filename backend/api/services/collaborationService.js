const Collaboration = require('../models/Collaboration');
const Notification = require('../models/Notification');

const getCollaborations = async (studentId = null) => {
  const filter = studentId ? { studentIds: studentId } : {};
  return Collaboration.find(filter).sort({ createdAt: -1 });
};

const createCollaboration = async ({ studentIds, projectTitle, adminRationale }) => {
  const collaboration = await Collaboration.create({
    studentIds,
    projectTitle,
    adminRationale,
    responses: studentIds.map((studentId) => ({ studentId, status: 'pending' }))
  });

  await Notification.insertMany(
    studentIds.map((userId) => ({
      audience: 'student',
      userId,
      title: 'New collaborator request',
      body: `You've been matched with a new collaborator for ${projectTitle}.`,
      kind: 'team',
      read: false
    }))
  );

  return collaboration;
};

const respondToCollaboration = async (id, studentId, status) => {
  const collaboration = await Collaboration.findById(id);
  if (!collaboration) {
    const error = new Error('Collaboration not found');
    error.statusCode = 404;
    throw error;
  }

  const response = collaboration.responses.find((r) => r.studentId === studentId);
  if (!response) {
    const error = new Error('You are not a participant in this collaboration');
    error.statusCode = 403;
    throw error;
  }

  response.status = status;
  await collaboration.save();
  return collaboration;
};

module.exports = { getCollaborations, createCollaboration, respondToCollaboration };
