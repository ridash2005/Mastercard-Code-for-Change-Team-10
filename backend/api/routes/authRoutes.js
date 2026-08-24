const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireDatabase } = require('../middleware/dbMiddleware');

router.post('/register', requireDatabase, authController.register);
router.post('/login', requireDatabase, authController.login);
router.get('/me', authenticate, authController.getMe);
router.post('/onboarding', authenticate, authController.completeOnboarding);

module.exports = router;
