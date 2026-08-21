const enrollmentService = require('../services/enrollmentService');

// @desc    Get enrollments
// @route   GET /api/enrollments
// @access  Private
const getEnrollments = async (req, res, next) => {
  try {
    const studentId = req.user.role === 'admin' ? req.query.studentId || null : req.user._id.toString();
    const enrollments = await enrollmentService.getEnrollments(studentId, req.query);

    res.status(200).json({
      success: true,
      count: enrollments.length,
      data: enrollments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Enroll in activity
// @route   POST /api/enrollments
// @access  Private
const enroll = async (req, res, next) => {
  try {
    const { activityId } = req.body;
    const studentId = req.body.studentId || req.user._id.toString();

    if (!activityId) {
      return res.status(400).json({
        success: false,
        message: 'activityId is required'
      });
    }

    const enrollment = await enrollmentService.enroll(activityId, studentId);

    res.status(201).json({
      success: true,
      message: 'Enrolled successfully',
      data: enrollment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start an enrolled activity
// @route   PATCH /api/enrollments/:activityId/start
// @access  Private
const startActivity = async (req, res, next) => {
  try {
    const { activityId } = req.params;
    const studentId = req.body.studentId || req.user._id.toString();

    const enrollment = await enrollmentService.startActivity(activityId, studentId);

    res.status(200).json({
      success: true,
      message: 'Activity started',
      data: enrollment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get enrollment for single activity
// @route   GET /api/enrollments/:activityId
// @access  Private
const getEnrollment = async (req, res, next) => {
  try {
    const { activityId } = req.params;
    const studentId = req.query.studentId || req.user._id.toString();

    const enrollment = await enrollmentService.getEnrollment(activityId, studentId);

    res.status(200).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEnrollments,
  enroll,
  startActivity,
  getEnrollment
};
