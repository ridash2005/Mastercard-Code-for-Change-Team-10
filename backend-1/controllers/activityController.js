const activityService = require('../services/activityService');

// @desc    List activities with filters
// @route   GET /api/activities
// @access  Public / Optional Auth
const listActivities = async (req, res, next) => {
  try {
    const studentId = req.user ? req.user._id.toString() : req.query.studentId || null;
    const activities = await activityService.listActivities(req.query, studentId);

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get activity by ID
// @route   GET /api/activities/:id
// @access  Public / Optional Auth
const getActivityById = async (req, res, next) => {
  try {
    const studentId = req.user ? req.user._id.toString() : req.query.studentId || null;
    const activity = await activityService.getActivityById(req.params.id, studentId);

    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new activity (Admin only)
// @route   POST /api/activities
// @access  Private/Admin
const createActivity = async (req, res, next) => {
  try {
    const activity = await activityService.createActivity(req.body, req.user?._id?.toString());

    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: activity
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update activity (Admin only)
// @route   PUT /api/activities/:id
// @access  Private/Admin
const updateActivity = async (req, res, next) => {
  try {
    const activity = await activityService.updateActivity(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Activity updated successfully',
      data: activity
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete activity (Admin only)
// @route   DELETE /api/activities/:id
// @access  Private/Admin
const deleteActivity = async (req, res, next) => {
  try {
    await activityService.deleteActivity(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listActivities,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity
};
