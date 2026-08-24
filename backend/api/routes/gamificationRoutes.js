const express = require('express');
const router = express.Router();
const gamificationController = require('../controllers/gamificationController');
const { authenticate, optionalAuth } = require('../middleware/authMiddleware');
const { requireDatabase } = require('../middleware/dbMiddleware');

router.get('/dashboard', authenticate, gamificationController.getDashboard);
router.get('/leaderboard', optionalAuth, requireDatabase, gamificationController.getLeaderboard);
router.get('/achievements', authenticate, gamificationController.getAchievements);
router.get('/missions', optionalAuth, requireDatabase, gamificationController.getMissions);
router.get('/xp-transactions', authenticate, gamificationController.getXPTransactions);

module.exports = router;
