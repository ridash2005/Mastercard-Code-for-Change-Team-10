const express = require('express');
const router = express.Router();
const gamificationController = require('../controllers/gamificationController');
const { authenticate, optionalAuth } = require('../middleware/authMiddleware');

router.get('/dashboard', authenticate, gamificationController.getDashboard);
router.get('/leaderboard', optionalAuth, gamificationController.getLeaderboard);
router.get('/achievements', authenticate, gamificationController.getAchievements);
router.get('/missions', optionalAuth, gamificationController.getMissions);
router.get('/xp-transactions', authenticate, gamificationController.getXPTransactions);

module.exports = router;
