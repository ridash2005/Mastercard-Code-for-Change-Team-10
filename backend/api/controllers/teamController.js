const teamService = require('../services/teamService');

// @desc    Get all teams
// @route   GET /api/teams
// @access  Public / Private
const getTeams = async (req, res, next) => {
  try {
    const teams = await teamService.getTeams();

    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get team by ID
// @route   GET /api/teams/:id
// @access  Public / Private
const getTeamById = async (req, res, next) => {
  try {
    const team = await teamService.getTeamById(req.params.id);

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new team (Admin only)
// @route   POST /api/teams
// @access  Private/Admin
const createTeam = async (req, res, next) => {
  try {
    const team = await teamService.createTeam(req.body);

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: team
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add or update team member (Admin only)
// @route   POST /api/teams/:id/members
// @access  Private/Admin
const addOrUpdateMember = async (req, res, next) => {
  try {
    const { studentId, role, contribution } = req.body;
    const member = await teamService.addOrUpdateMember(
      req.params.id,
      studentId,
      role,
      contribution
    );

    res.status(200).json({
      success: true,
      message: 'Team member updated',
      data: member
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTeams,
  getTeamById,
  createTeam,
  addOrUpdateMember
};
