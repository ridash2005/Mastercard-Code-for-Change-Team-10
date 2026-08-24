const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const activityRoutes = require('./activityRoutes');
const enrollmentRoutes = require('./enrollmentRoutes');
const submissionRoutes = require('./submissionRoutes');
const meetingRoutes = require('./meetingRoutes');
const gamificationRoutes = require('./gamificationRoutes');
const teamRoutes = require('./teamRoutes');
const notificationRoutes = require('./notificationRoutes');
const feedbackRoutes = require('./feedbackRoutes');
const complaintRoutes = require('./complaintRoutes');
const certificateRoutes = require('./certificateRoutes');
const extracurricularRoutes = require('./extracurricularRoutes');
const contactRoutes = require('./contactRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const healthRoutes = require('./healthRoutes');
const aiRoutes = require('./aiRoutes');

// /api/health works regardless of DB state (it reports DB status itself).
// Every other route needs Mongo, but the fast-fail guard for that
// (middleware/dbMiddleware.js's requireDatabase) is applied per-route rather
// than blanket here: routes gated by `authenticate` get it for free (it
// runs inside authenticate, after the token-presence check but before the
// DB lookup) so an unauthenticated request still gets a fast 401 instead of
// a DB-availability 503 - see middleware/authMiddleware.js. Routes with no
// auth gate at all, or gated by `optionalAuth` (which never blocks), apply
// requireDatabase explicitly in their own route file.
router.use('/health', healthRoutes);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/activities', activityRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/submissions', submissionRoutes);
router.use('/meetings', meetingRoutes);
router.use('/gamification', gamificationRoutes);
router.use('/teams', teamRoutes);
router.use('/notifications', notificationRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/complaints', complaintRoutes);
router.use('/certificates', certificateRoutes);
router.use('/extracurricular', extracurricularRoutes);
router.use('/contact', contactRoutes);
router.use('/admin/analytics', analyticsRoutes);
router.use('/ai', aiRoutes);

module.exports = router;
