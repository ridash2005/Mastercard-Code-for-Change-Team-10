const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/', authenticate, feedbackController.getFeedbacks);
router.post('/', authenticate, feedbackController.createFeedback);

module.exports = router;
