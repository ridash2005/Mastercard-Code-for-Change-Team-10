const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { authenticate, authorize, optionalAuth } = require('../middleware/authMiddleware');
const { requireDatabase } = require('../middleware/dbMiddleware');

router.get('/', optionalAuth, requireDatabase, teamController.getTeams);
router.get('/:id', optionalAuth, requireDatabase, teamController.getTeamById);
router.post('/', authenticate, authorize('admin'), teamController.createTeam);
router.post('/:id/members', authenticate, authorize('admin'), teamController.addOrUpdateMember);

module.exports = router;
