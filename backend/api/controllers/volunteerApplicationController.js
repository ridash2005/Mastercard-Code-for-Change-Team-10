const volunteerApplicationService = require('../services/volunteerApplicationService');

// @desc    List volunteer applications (optionally filtered by status)
// @route   GET /api/volunteer-applications
// @access  Admin
const getApplications = async (req, res, next) => {
  try {
    const applications = await volunteerApplicationService.getApplications(req.query);

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit a volunteer application
// @route   POST /api/volunteer-applications
// @access  Public
const createApplication = async (req, res, next) => {
  try {
    const { name, email, interests, skills, college, message } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'name and email are required' });
    }

    const application = await volunteerApplicationService.createApplication({
      name,
      email,
      interests: Array.isArray(interests) ? interests : [],
      skills: Array.isArray(skills) ? skills : [],
      college,
      message
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or reject a volunteer application
// @route   PATCH /api/volunteer-applications/:id/status
// @access  Admin
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (pending, approved, rejected)'
      });
    }

    const application = await volunteerApplicationService.updateApplicationStatus(req.params.id, status);

    res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      data: application
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getApplications, createApplication, updateApplicationStatus };
