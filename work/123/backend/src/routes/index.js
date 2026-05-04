const express = require('express');
const router = express.Router();

const simulationRoutes = require('./simulationRoutes');
const optimizationRoutes = require('./optimizationRoutes');
const resultRoutes = require('./resultRoutes');
const realtimeRoutes = require('./realtimeRoutes');

router.use('/simulations', simulationRoutes);
router.use('/optimization', optimizationRoutes);
router.use('/results', resultRoutes);
router.use('/realtime', realtimeRoutes);
router.use('/twin', realtimeRoutes);

module.exports = router;
