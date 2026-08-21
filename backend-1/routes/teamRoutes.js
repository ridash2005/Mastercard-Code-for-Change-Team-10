const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { authenticate, authorize, optionalAuth } = require('../middleware/authMiddleware');

router.get('/', optionalAuth, teamController.getTeams);
router.get('/:id', optionalAuth, teamController.getTeamById);
router.post('/', authenticate, authorize('admin'), teamController.createTeam);
router.post('/:id/members', authenticate, authorize('admin'), teamController.addOrUpdateMember);

module.exports = router;
