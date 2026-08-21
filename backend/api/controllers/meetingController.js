const meetingService = require('../services/meetingService');

// @desc    Get meetings
// @route   GET /api/meetings
// @access  Private
const getMeetings = async (req, res, next) => {
  try {
    const studentId = req.user.role === 'admin' ? req.query.studentId || null : req.user._id.toString();
    const meetings = await meetingService.getMeetings(studentId, req.query);

    res.status(200).json({
      success: true,
      count: meetings.length,
      data: meetings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get meeting by ID
// @route   GET /api/meetings/:id
// @access  Private
const getMeetingById = async (req, res, next) => {
  try {
    const meeting = await meetingService.getMeetingById(req.params.id);

    res.status(200).json({
      success: true,
      data: meeting
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create meeting (Admin only)
// @route   POST /api/meetings
// @access  Private/Admin
const createMeeting = async (req, res, next) => {
  try {
    const meeting = await meetingService.createMeeting(req.body);

    res.status(201).json({
      success: true,
      message: 'Meeting scheduled successfully',
      data: meeting
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update meeting (Admin only)
// @route   PUT /api/meetings/:id
// @access  Private/Admin
const updateMeeting = async (req, res, next) => {
  try {
    const meeting = await meetingService.updateMeeting(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Meeting updated successfully',
      data: meeting
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete meeting (Admin only)
// @route   DELETE /api/meetings/:id
// @access  Private/Admin
const deleteMeeting = async (req, res, next) => {
  try {
    await meetingService.deleteMeeting(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Meeting deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reschedule meeting slot
// @route   POST /api/meetings/:id/reschedule
// @access  Private
const rescheduleMeeting = async (req, res, next) => {
  try {
    const { slot } = req.body;
    const studentId = req.user._id.toString();

    if (!slot) {
      return res.status(400).json({
        success: false,
        message: 'slot date is required'
      });
    }

    const meeting = await meetingService.rescheduleMeeting(req.params.id, studentId, slot);

    res.status(200).json({
      success: true,
      message: 'Meeting rescheduled successfully',
      data: meeting
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMeetings,
  getMeetingById,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  rescheduleMeeting
};
