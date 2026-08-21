const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/', authenticate, submissionController.getSubmissions);
router.get('/:id', authenticate, submissionController.getSubmissionById);
router.post('/', authenticate, submissionController.submitWork);
router.post('/:id/review', authenticate, authorize('admin'), submissionController.reviewSubmission);

module.exports = router;
