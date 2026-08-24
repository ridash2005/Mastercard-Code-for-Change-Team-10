const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireDatabase } = require('../middleware/dbMiddleware');
const { createRateLimiter } = require('../services/ai/rateLimiter');

// Keyed by IP (both routes are unauthenticated) - bounds both email-sending
// cost and brute-force guessing of reset tokens.
const passwordResetLimiter = createRateLimiter({ windowMs: 15 * 60_000, max: 5, keyPrefix: 'password_reset' });

router.post('/register', requireDatabase, authController.register);
router.post('/login', requireDatabase, authController.login);
router.get('/me', authenticate, authController.getMe);
router.post('/onboarding', authenticate, authController.completeOnboarding);
router.post('/forgot-password', requireDatabase, passwordResetLimiter, authController.forgotPassword);
router.post('/reset-password', requireDatabase, passwordResetLimiter, authController.resetPassword);

module.exports = router;
