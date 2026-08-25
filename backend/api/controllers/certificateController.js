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

// @desc    Download a certificate as a PDF file
// @route   GET /api/certificates/:id/download
// @access  Private (owning student, or admin)
const downloadCertificate = async (req, res, next) => {
  try {
    const certificate = await certificateService.getCertificateById(req.params.id);

    const isOwner = certificate.studentId === req.user._id.toString();
    if (req.user.role !== 'admin' && !isOwner) {
      const error = new Error('Not authorized to download this certificate.');
      error.statusCode = 403;
      throw error;
    }

    const pdf = await certificateService.renderCertificatePdf(certificate);
    const fileName = `${(certificate.activity?.title || certificate.title || 'certificate').replace(/[^a-z0-9]+/gi, '-')}.pdf`;

    res.status(200);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdf.length);
    res.send(pdf);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCertificates,
  getCertificateById,
  downloadCertificate
};
