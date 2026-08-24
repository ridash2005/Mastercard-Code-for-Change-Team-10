const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { requireDatabase } = require('../middleware/dbMiddleware');

router.post('/', requireDatabase, contactController.submitContact);
router.get('/', authenticate, authorize('admin'), contactController.getContactMessages);

module.exports = router;
