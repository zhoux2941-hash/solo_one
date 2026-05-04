const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const optimizationController = require('../controllers/optimizationController');

router.post('/intersection', asyncHandler(optimizationController.optimizeIntersection));
router.post('/start', asyncHandler(optimizationController.startOptimization));
router.get('/:id/status', asyncHandler(optimizationController.getOptimizationStatus));
router.get('/:id/result', asyncHandler(optimizationController.getOptimizationResult));

module.exports = router;
