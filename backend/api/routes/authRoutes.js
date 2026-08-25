const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const oauthController = require('../controllers/oauthController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireDatabase } = require('../middleware/dbMiddleware');
const { createRateLimiter } = require('../services/ai/rateLimiter');

// Keyed by IP (both routes are unauthenticated) - bounds both email-sending
// cost and brute-force guessing of reset tokens.
const passwordResetLimiter = createRateLimiter({ windowMs: 15 * 60_000, max: 5, keyPrefix: 'password_reset' });

// Keyed by IP - bounds abuse of the redirect-initiate routes and
// brute-forcing the one-time exchange code.
const oauthLimiter = createRateLimiter({ windowMs: 15 * 60_000, max: 20, keyPrefix: 'oauth' });

router.post('/register', requireDatabase, authController.register);
router.post('/login', requireDatabase, authController.login);
router.get('/me', authenticate, authController.getMe);
router.post('/onboarding', authenticate, authController.completeOnboarding);
router.post('/forgot-password', requireDatabase, passwordResetLimiter, authController.forgotPassword);
router.post('/reset-password', requireDatabase, passwordResetLimiter, authController.resetPassword);

// "Sign in with Google/GitHub" - see controllers/oauthController.js's
// docstring for the full redirect -> callback -> exchange flow.
router.get('/google', oauthLimiter, oauthController.googleRedirect);
router.get('/google/callback', requireDatabase, oauthController.googleCallback);
router.get('/github', oauthLimiter, oauthController.githubRedirect);
router.get('/github/callback', requireDatabase, oauthController.githubCallback);
router.post('/oauth/exchange', requireDatabase, oauthLimiter, oauthController.exchangeCode);

module.exports = router;
