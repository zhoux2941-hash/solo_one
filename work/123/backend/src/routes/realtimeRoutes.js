const express = require('express');
const router = express.Router();
const realtimeController = require('../controllers/realtimeController');

router.post('/:simulationId/sensor', realtimeController.injectSensorData);

router.post('/:simulationId/sensor/batch', realtimeController.injectBatchSensorData);

router.get('/:simulationId/state', realtimeController.getRealtimeState);

router.get('/:simulationId/detector/:edgeId', realtimeController.getDetectorData);

router.post('/:simulationId/generator/start', realtimeController.startDataGenerator);

router.post('/:simulationId/generator/stop', realtimeController.stopDataGenerator);

router.get('/active', realtimeController.getActiveSimulations);

router.post('/twin/create', realtimeController.createDigitalTwin);

router.post('/twin/start', realtimeController.startDigitalTwin);

router.get('/twin/list', realtimeController.getAllTwins);

router.get('/twin/:twinId/state', realtimeController.getTwinState);

router.post('/twin/:twinId/pause', realtimeController.pauseDigitalTwin);

router.post('/twin/:twinId/resume', realtimeController.resumeDigitalTwin);

router.post('/twin/:twinId/stop', realtimeController.stopDigitalTwin);

router.post('/twin/:twinId/strategy', realtimeController.setControlStrategy);

router.post('/twin/:twinId/mode', realtimeController.setTwinMode);

router.post('/twin/:twinId/export', realtimeController.exportTwinData);

router.get('/signal/statistics', realtimeController.getSignalControlStatistics);

module.exports = router;
