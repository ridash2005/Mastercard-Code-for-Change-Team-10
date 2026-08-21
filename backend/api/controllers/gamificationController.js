const gamificationService = require('../services/gamificationService');

// @desc    Get student gamification dashboard
// @route   GET /api/gamification/dashboard
// @access  Private
const getDashboard = async (req, res, next) => {
  try {
    const studentId = req.query.studentId || req.user._id.toString();
    const dashboard = await gamificationService.getDashboard(studentId);

    res.status(200).json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get global leaderboard
// @route   GET /api/gamification/leaderboard
// @access  Public / Private
const getLeaderboard = async (req, res, next) => {
  try {
    const leaderboard = await gamificationService.getLeaderboard(req.query);

    res.status(200).json({
      success: true,
      count: leaderboard.length,
      data: leaderboard
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all achievements and student's unlocks
// @route   GET /api/gamification/achievements
// @access  Private
const getAchievements = async (req, res, next) => {
  try {
    const studentId = req.user.role === 'student' ? req.user._id.toString() : req.query.studentId || null;
    const achievements = await gamificationService.getAchievements(studentId);

    res.status(200).json({
      success: true,
      count: achievements.length,
      data: achievements
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get missions
// @route   GET /api/gamification/missions
// @access  Private
const getMissions = async (req, res, next) => {
  try {
    const missions = await gamificationService.getMissions();

    res.status(200).json({
      success: true,
      count: missions.length,
      data: missions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student XP transactions history
// @route   GET /api/gamification/xp-transactions
// @access  Private
const getXPTransactions = async (req, res, next) => {
  try {
    const studentId = req.user.role === 'student' ? req.user._id.toString() : req.query.studentId || req.user._id.toString();
    const transactions = await gamificationService.getXPTransactions(studentId);

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getLeaderboard,
  getAchievements,
  getMissions,
  getXPTransactions
};
