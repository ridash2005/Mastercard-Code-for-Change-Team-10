const express = require('express');
const router = express.Router();
const extracurricularController = require('../controllers/extracurricularController');
const { authenticate, authorize, optionalAuth } = require('../middleware/authMiddleware');

router.get('/', optionalAuth, extracurricularController.getExtracurriculars);
router.get('/:id', optionalAuth, extracurricularController.getExtracurricularById);
router.post('/', authenticate, authorize('admin'), extracurricularController.createExtracurricular);

module.exports = router;
