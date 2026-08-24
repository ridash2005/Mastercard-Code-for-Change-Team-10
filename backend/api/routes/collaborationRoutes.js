const express = require('express');
const router = express.Router();
const collaborationController = require('../controllers/collaborationController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/', authenticate, collaborationController.getCollaborations);
router.post('/', authenticate, authorize('admin'), collaborationController.createCollaboration);
router.post('/:id/respond', authenticate, collaborationController.respondToCollaboration);

module.exports = router;
