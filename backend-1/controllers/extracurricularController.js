const extracurricularService = require('../services/extracurricularService');

// @desc    Get extracurricular activities
// @route   GET /api/extracurricular
// @access  Public / Private
const getExtracurriculars = async (req, res, next) => {
  try {
    const activities = await extracurricularService.getExtracurriculars(req.query);

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get extracurricular activity by ID
// @route   GET /api/extracurricular/:id
// @access  Public / Private
const getExtracurricularById = async (req, res, next) => {
  try {
    const activity = await extracurricularService.getExtracurricularById(req.params.id);

    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create extracurricular activity (Admin only)
// @route   POST /api/extracurricular
// @access  Private/Admin
const createExtracurricular = async (req, res, next) => {
  try {
    const activity = await extracurricularService.createExtracurricular(req.body);

    res.status(201).json({
      success: true,
      message: 'Extracurricular activity created successfully',
      data: activity
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExtracurriculars,
  getExtracurricularById,
  createExtracurricular
};
