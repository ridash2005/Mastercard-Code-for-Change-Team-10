const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/', authenticate, certificateController.getCertificates);
router.get('/:id/download', authenticate, certificateController.downloadCertificate);
router.get('/:id', authenticate, certificateController.getCertificateById);

module.exports = router;
