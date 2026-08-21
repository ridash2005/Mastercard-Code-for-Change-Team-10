const submissionService = require('../services/submissionService');

// @desc    Get submissions
// @route   GET /api/submissions
// @access  Private
const getSubmissions = async (req, res, next) => {
  try {
    const studentId = req.user.role === 'admin' ? req.query.studentId || null : req.user._id.toString();
    const submissions = await submissionService.getSubmissions(studentId, req.query);

    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get submission by ID
// @route   GET /api/submissions/:id
// @access  Private
const getSubmissionById = async (req, res, next) => {
  try {
    const submission = await submissionService.getSubmissionById(req.params.id);

    res.status(200).json({
      success: true,
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit work for an activity
// @route   POST /api/submissions
// @access  Private
const submitWork = async (req, res, next) => {
  try {
    const { activityId, text, link, notes, fileName } = req.body;
    const studentId = req.body.studentId || req.user._id.toString();

    if (!activityId) {
      return res.status(400).json({
        success: false,
        message: 'activityId is required'
      });
    }

    const submission = await submissionService.submitWork({
      activityId,
      studentId,
      text,
      link,
      notes,
      fileName
    });

    res.status(201).json({
      success: true,
      message: 'Work submitted successfully',
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Review a submission (Admin only)
// @route   POST /api/submissions/:id/review
// @access  Private/Admin
const reviewSubmission = async (req, res, next) => {
  try {
    const { action, score, feedback } = req.body;
    const submissionId = req.params.id;
    const reviewerId = req.user._id.toString();

    if (!action || !['approve', 'reject', 'resubmit'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Valid action is required (approve, reject, resubmit)'
      });
    }

    const submission = await submissionService.reviewSubmission({
      submissionId,
      reviewerId,
      action,
      score: Number(score) || 0,
      feedback: feedback || ''
    });

    res.status(200).json({
      success: true,
      message: `Submission ${action}d successfully`,
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSubmissions,
  getSubmissionById,
  submitWork,
  reviewSubmission
};
