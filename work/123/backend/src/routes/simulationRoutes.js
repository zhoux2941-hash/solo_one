const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const simulationController = require('../controllers/simulationController');

router.post('/create', asyncHandler(simulationController.createSimulation));
router.get('/list', asyncHandler(simulationController.listSimulations));
router.get('/queue/status', asyncHandler(simulationController.getQueueStatus));
router.get('/:id', asyncHandler(simulationController.getSimulation));
router.post('/:id/start', asyncHandler(simulationController.startSimulation));
router.delete('/:id', asyncHandler(simulationController.deleteSimulation));
router.get('/:id/status', asyncHandler(simulationController.getSimulationStatus));

module.exports = router;
