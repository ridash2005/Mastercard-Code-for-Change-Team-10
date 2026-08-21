const ContactMessage = require('../models/ContactMessage');
const Notification = require('../models/Notification');

const createContactMessage = async (data) => {
  const message = await ContactMessage.create(data);

  // Notify admin
  await Notification.create({
    audience: 'admin',
    title: `Contact · ${data.category || 'General'}`,
    body: `${data.name} (${data.email}): ${(data.message || '').slice(0, 140)}`,
    kind: 'review',
    read: false
  });

  return message;
};

const getContactMessages = async () => {
  return ContactMessage.find().sort({ createdAt: -1 });
};

module.exports = {
  createContactMessage,
  getContactMessages
};
