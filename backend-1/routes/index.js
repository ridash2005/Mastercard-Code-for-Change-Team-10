const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const healthRoutes = require('./healthRoutes');
const aiRoutes = require('./aiRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/health', healthRoutes);
router.use('/ai', aiRoutes);

module.exports = router;
