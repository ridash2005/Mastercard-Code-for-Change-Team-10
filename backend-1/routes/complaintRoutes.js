const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/', authenticate, complaintController.getComplaints);
router.post('/', authenticate, complaintController.createComplaint);
router.patch('/:id/status', authenticate, authorize('admin'), complaintController.updateComplaintStatus);

module.exports = router;
