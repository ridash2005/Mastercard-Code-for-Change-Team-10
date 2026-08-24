const express = require('express');
const router = express.Router();
const volunteerApplicationController = require('../controllers/volunteerApplicationController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { requireDatabase } = require('../middleware/dbMiddleware');

router.get('/', authenticate, authorize('admin'), volunteerApplicationController.getApplications);
router.post('/', requireDatabase, volunteerApplicationController.createApplication);
router.patch('/:id/status', authenticate, authorize('admin'), volunteerApplicationController.updateApplicationStatus);

module.exports = router;
