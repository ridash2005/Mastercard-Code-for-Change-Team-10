const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { authenticate, authorize, optionalAuth } = require('../middleware/authMiddleware');

router.get('/', optionalAuth, activityController.listActivities);
router.get('/:id', optionalAuth, activityController.getActivityById);
router.post('/', authenticate, authorize('admin'), activityController.createActivity);
router.put('/:id', authenticate, authorize('admin'), activityController.updateActivity);
router.delete('/:id', authenticate, authorize('admin'), activityController.deleteActivity);

module.exports = router;
