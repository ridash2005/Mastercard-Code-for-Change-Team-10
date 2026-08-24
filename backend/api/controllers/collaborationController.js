const collaborationService = require('../services/collaborationService');

// @desc    List collaborations (admin: all, student: their own)
// @route   GET /api/collaborations
// @access  Private
const getCollaborations = async (req, res, next) => {
  try {
    const studentId = req.user.role === 'admin' ? null : req.user._id.toString();
    const collaborations = await collaborationService.getCollaborations(studentId);

    res.status(200).json({
      success: true,
      count: collaborations.length,
      data: collaborations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a collaboration invite between students
// @route   POST /api/collaborations
// @access  Admin
const createCollaboration = async (req, res, next) => {
  try {
    const { studentIds, projectTitle, adminRationale } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'studentIds must include at least two students'
      });
    }
    if (!projectTitle) {
      return res.status(400).json({ success: false, message: 'projectTitle is required' });
    }

    const collaboration = await collaborationService.createCollaboration({
      studentIds,
      projectTitle,
      adminRationale
    });

    res.status(201).json({
      success: true,
      message: 'Collaboration created successfully',
      data: collaboration
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept/decline a collaboration invite
// @route   POST /api/collaborations/:id/respond
// @access  Private (student)
const respondToCollaboration = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be accepted or declined' });
    }

    const collaboration = await collaborationService.respondToCollaboration(
      req.params.id,
      req.user._id.toString(),
      status
    );

    res.status(200).json({
      success: true,
      message: 'Response recorded',
      data: collaboration
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCollaborations, createCollaboration, respondToCollaboration };
