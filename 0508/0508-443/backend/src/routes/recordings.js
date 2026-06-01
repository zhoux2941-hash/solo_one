const express = require('express');
const router = express.Router();
const streamRecorder = require('../modules/streamRecorder');

router.get('/', async (req, res) => {
  try {
    const filters = {
      streamId: req.query.streamId,
      streamAddress: req.query.streamAddress
    };
    
    const recordings = await streamRecorder.getRecordings(filters);
    res.json(recordings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/status', (req, res) => {
  try {
    const statuses = streamRecorder.getAllRecordingStatus();
    res.json(statuses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const recording = await streamRecorder.getRecording(req.params.id);
    if (recording) {
      res.json(recording);
    } else {
      res.status(404).json({ error: 'Recording not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:streamId/start', async (req, res) => {
  try {
    const { segmentDuration } = req.body;
    const result = await streamRecorder.startRecording(req.params.streamId, {
      segmentDuration
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:streamId/stop', async (req, res) => {
  try {
    const result = await streamRecorder.stopRecording(req.params.streamId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await streamRecorder.deleteRecording(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
