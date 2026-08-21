const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/overview', authenticate, authorize('admin'), analyticsController.getOverview);
router.get('/reports', authenticate, authorize('admin'), analyticsController.getReports);

module.exports = router;
