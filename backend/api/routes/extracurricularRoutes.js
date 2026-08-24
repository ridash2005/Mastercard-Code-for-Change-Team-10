const express = require('express');
const router = express.Router();
const extracurricularController = require('../controllers/extracurricularController');
const { authenticate, authorize, optionalAuth } = require('../middleware/authMiddleware');
const { requireDatabase } = require('../middleware/dbMiddleware');

router.get('/', optionalAuth, requireDatabase, extracurricularController.getExtracurriculars);
router.get('/:id', optionalAuth, requireDatabase, extracurricularController.getExtracurricularById);
router.post('/', authenticate, authorize('admin'), extracurricularController.createExtracurricular);

module.exports = router;
