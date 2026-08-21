const feedbackService = require('../services/feedbackService');

// @desc    Get feedback records
// @route   GET /api/feedback
// @access  Private
const getFeedbacks = async (req, res, next) => {
  try {
    const userId = req.user.role === 'admin' ? req.query.userId || null : req.user._id.toString();
    const feedbacks = await feedbackService.getFeedbacks(userId);

    res.status(200).json({
      success: true,
      count: feedbacks.length,
      data: feedbacks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit new feedback
// @route   POST /api/feedback
// @access  Private
const createFeedback = async (req, res, next) => {
  try {
    const { category, rating, message } = req.body;
    const userId = req.user._id.toString();

    if (!category || rating === undefined || !message) {
      return res.status(400).json({
        success: false,
        message: 'category, rating (1-5), and message are required'
      });
    }

    const feedback = await feedbackService.createFeedback(
      { category, rating: Number(rating), message },
      userId
    );

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFeedbacks,
  createFeedback
};
