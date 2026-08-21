const complaintService = require('../services/complaintService');

// @desc    Get complaints
// @route   GET /api/complaints
// @access  Private
const getComplaints = async (req, res, next) => {
  try {
    const userId = req.user.role === 'admin' ? req.query.userId || null : req.user._id.toString();
    const complaints = await complaintService.getComplaints(userId);

    res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create complaint
// @route   POST /api/complaints
// @access  Private
const createComplaint = async (req, res, next) => {
  try {
    const { category, subject, description, priority, attachmentName } = req.body;
    const userId = req.user._id.toString();

    if (!category || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'category, subject, and description are required'
      });
    }

    const complaint = await complaintService.createComplaint(
      { category, subject, description, priority, attachmentName },
      userId
    );

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update complaint status (Admin only)
// @route   PATCH /api/complaints/:id/status
// @access  Private/Admin
const updateComplaintStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status || !['submitted', 'under_review', 'in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (submitted, under_review, in_progress, resolved)'
      });
    }

    const complaint = await complaintService.updateComplaintStatus(req.params.id, status);

    res.status(200).json({
      success: true,
      message: 'Complaint status updated successfully',
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getComplaints,
  createComplaint,
  updateComplaintStatus
};
