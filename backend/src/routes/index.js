const express = require('express');
const navigationRoutes = require('./navigationRoutes');
const buildingRoutes = require('./buildingRoutes');
const adminRoutes = require('./adminRoutes');
const healthRoutes = require('./healthRoutes');

const router = express.Router();

router.use(healthRoutes);
router.use('/navigation', navigationRoutes);
router.use('/buildings', buildingRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
