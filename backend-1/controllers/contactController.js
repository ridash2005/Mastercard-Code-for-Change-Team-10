const contactService = require('../services/contactService');

// @desc    Submit contact message
// @route   POST /api/contact
// @access  Public
const submitContact = async (req, res, next) => {
  try {
    const { name, email, category, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'name, email, and message are required'
      });
    }

    const result = await contactService.createContactMessage({
      name,
      email,
      category: category || 'General',
      message
    });

    res.status(201).json({
      success: true,
      message: 'Your message has been received. Our team will get back to you shortly.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all contact messages (Admin only)
// @route   GET /api/contact
// @access  Private/Admin
const getContactMessages = async (req, res, next) => {
  try {
    const messages = await contactService.getContactMessages();

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitContact,
  getContactMessages
};
