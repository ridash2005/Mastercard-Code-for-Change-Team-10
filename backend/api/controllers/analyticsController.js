const analyticsService = require('../services/analyticsService');

// @desc    Get programme analytics overview (Admin only)
// @route   GET /api/admin/analytics/overview
// @access  Private/Admin
const getOverview = async (req, res, next) => {
  try {
    const overview = await analyticsService.getOverview();

    res.status(200).json({
      success: true,
      data: overview
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed student performance reports (Admin only)
// @route   GET /api/admin/analytics/reports
// @access  Private/Admin
const getReports = async (req, res, next) => {
  try {
    const reports = await analyticsService.getReports(req.query);

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getReports
};
