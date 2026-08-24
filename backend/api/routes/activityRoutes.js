const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { authenticate, authorize, optionalAuth } = require('../middleware/authMiddleware');
const { requireDatabase } = require('../middleware/dbMiddleware');

router.get('/', optionalAuth, requireDatabase, activityController.listActivities);
router.get('/:id', optionalAuth, requireDatabase, activityController.getActivityById);
router.post('/', authenticate, authorize('admin'), activityController.createActivity);
router.put('/:id', authenticate, authorize('admin'), activityController.updateActivity);
router.delete('/:id', authenticate, authorize('admin'), activityController.deleteActivity);

module.exports = router;
