const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const recorder = require('../services/recorder');
const framePipeline = require('../services/framePipeline');
const logger = require('../utils/logger');
const config = require('../config');

router.get('/', (req, res) => {
  try {
    const { streamId } = req.query;
    const recordings = recorder.getRecordings(streamId);
    
    res.json({
      success: true,
      recordings
    });
  } catch (error) {
    logger.error('Get recordings error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:recordingId', (req, res) => {
  try {
    const { recordingId } = req.params;
    const recording = recorder.getRecordingInfo(recordingId);
    
    if (!recording) {
      return res.status(404).json({ 
        success: false, 
        error: `Recording ${recordingId} not found` 
      });
    }
    
    res.json({ success: true, recording });
  } catch (error) {
    logger.error('Get recording error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/start', (req, res) => {
  try {
    const { streamId, scale } = req.body;
    
    if (!streamId) {
      return res.status(400).json({ 
        success: false, 
        error: 'streamId is required' 
      });
    }

    const streams = framePipeline.getActiveStreams();
    const streamExists = streams.some(s => s.streamId === streamId);
    
    if (!streamExists) {
      return res.status(404).json({ 
        success: false, 
        error: `Stream ${streamId} not found` 
      });
    }

    const result = recorder.startRecording(
      streamId, 
      scale || config.superres.defaultScale
    );
    
    res.json(result);
  } catch (error) {
    logger.error('Start recording error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:streamId/stop', async (req, res) => {
  try {
    const { streamId } = req.params;
    
    if (!recorder.isRecording(streamId)) {
      return res.status(400).json({ 
        success: false, 
        error: `No recording in progress for stream ${streamId}` 
      });
    }

    const result = await recorder.stopRecording(streamId);
    res.json(result);
  } catch (error) {
    logger.error('Stop recording error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:recordingId/download/:type', (req, res) => {
  try {
    const { recordingId, type } = req.params;
    
    if (!['input', 'output'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        error: 'type must be "input" or "output"' 
      });
    }

    const recording = recorder.getRecordingInfo(recordingId);
    if (!recording) {
      return res.status(404).json({ 
        success: false, 
        error: `Recording ${recordingId} not found` 
      });
    }

    const filePath = type === 'input' ? recording.input_path : recording.output_path;
    
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        error: `${type} video file not found` 
      });
    }

    const fileName = `${recordingId}_${type}.mp4`;
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'video/mp4');
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      logger.error('Download error', { error: error.message, recordingId, type });
      res.status(500).json({ success: false, error: error.message });
    });
    
  } catch (error) {
    logger.error('Download error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:recordingId/compare', async (req, res) => {
  try {
    const { recordingId } = req.params;
    const recording = recorder.getRecordingInfo(recordingId);
    
    if (!recording) {
      return res.status(404).json({ 
        success: false, 
        error: `Recording ${recordingId} not found` 
      });
    }

    const inputExists = recording.input_path && fs.existsSync(recording.input_path);
    const outputExists = recording.output_path && fs.existsSync(recording.output_path);

    if (!inputExists || !outputExists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Video files not found for comparison' 
      });
    }

    res.json({
      success: true,
      recordingId,
      streamId: recording.stream_id,
      startTime: recording.start_time,
      endTime: recording.end_time,
      durationSec: recording.duration_sec,
      scaleFactor: recording.scale_factor,
      input: {
        path: recording.input_path,
        size: fs.statSync(recording.input_path).size,
        downloadUrl: `/api/recordings/${recordingId}/download/input`
      },
      output: {
        path: recording.output_path,
        size: fs.statSync(recording.output_path).size,
        downloadUrl: `/api/recordings/${recordingId}/download/output`
      }
    });
  } catch (error) {
    logger.error('Compare recordings error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:recordingId', (req, res) => {
  try {
    const { recordingId } = req.params;
    const recording = recorder.getRecordingInfo(recordingId);
    
    if (!recording) {
      return res.status(404).json({ 
        success: false, 
        error: `Recording ${recordingId} not found` 
      });
    }

    if (recording.input_path && fs.existsSync(recording.input_path)) {
      fs.unlinkSync(recording.input_path);
    }
    if (recording.output_path && fs.existsSync(recording.output_path)) {
      fs.unlinkSync(recording.output_path);
    }

    const db = require('../services/database');
    db.db.prepare('DELETE FROM recordings WHERE recording_id = ?').run(recordingId);

    logger.info('Recording deleted', { recordingId });
    
    res.json({ success: true, recordingId });
  } catch (error) {
    logger.error('Delete recording error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
