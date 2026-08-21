const certificateService = require('../services/certificateService');

// @desc    Get certificates for authenticated student
// @route   GET /api/certificates
// @access  Private
const getCertificates = async (req, res, next) => {
  try {
    const studentId = req.user.role === 'admin' ? req.query.studentId || null : req.user._id.toString();
    const certificates = await certificateService.getCertificates(studentId);

    res.status(200).json({
      success: true,
      count: certificates.length,
      data: certificates
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get certificate by ID
// @route   GET /api/certificates/:id
// @access  Private
const getCertificateById = async (req, res, next) => {
  try {
    const certificate = await certificateService.getCertificateById(req.params.id);

    res.status(200).json({
      success: true,
      data: certificate
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCertificates,
  getCertificateById
};
