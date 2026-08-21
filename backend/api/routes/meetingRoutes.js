const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/', authenticate, meetingController.getMeetings);
router.post('/', authenticate, authorize('admin'), meetingController.createMeeting);
router.get('/:id', authenticate, meetingController.getMeetingById);
router.put('/:id', authenticate, authorize('admin'), meetingController.updateMeeting);
router.delete('/:id', authenticate, authorize('admin'), meetingController.deleteMeeting);
router.post('/:id/reschedule', authenticate, meetingController.rescheduleMeeting);

module.exports = router;
