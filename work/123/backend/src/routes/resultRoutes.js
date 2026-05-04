const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const resultController = require('../controllers/resultController');

router.get('/:simulationId/trajectory', asyncHandler(resultController.getTrajectoryData));
router.get('/:simulationId/trajectory/:time', asyncHandler(resultController.getTrajectoryAtTime));
router.get('/:simulationId/snapshots', asyncHandler(resultController.getSnapshotList));
router.get('/:simulationId/snapshots/:index', asyncHandler(resultController.getSnapshot));
router.get('/:simulationId/heatmap', asyncHandler(resultController.getHeatmapData));
router.get('/:simulationId/statistics', asyncHandler(resultController.getStatistics));

module.exports = router;
