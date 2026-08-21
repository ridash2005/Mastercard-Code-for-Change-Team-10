const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/', authenticate, enrollmentController.getEnrollments);
router.post('/', authenticate, enrollmentController.enroll);
router.patch('/:activityId/start', authenticate, enrollmentController.startActivity);
router.get('/:activityId', authenticate, enrollmentController.getEnrollment);

module.exports = router;
