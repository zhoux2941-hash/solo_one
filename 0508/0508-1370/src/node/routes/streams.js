const express = require('express');
const router = express.Router();
const framePipeline = require('../services/framePipeline');
const db = require('../services/database');
const logger = require('../utils/logger');
const config = require('../config');

router.get('/', (req, res) => {
  try {
    const streams = framePipeline.getActiveStreams();
    res.json({
      success: true,
      streams,
      maxStreams: config.media.maxStreams
    });
  } catch (error) {
    logger.error('Get streams error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:streamId', (req, res) => {
  try {
    const { streamId } = req.params;
    const stats = framePipeline.getStreamStats(streamId);
    
    if (!stats) {
      return res.status(404).json({ 
        success: false, 
        error: `Stream ${streamId} not found` 
      });
    }
    
    res.json({ success: true, stats });
  } catch (error) {
    logger.error('Get stream error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:streamId/scale', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { scale, async = true } = req.body;
    
    if (!scale) {
      return res.status(400).json({ 
        success: false, 
        error: 'scale is required' 
      });
    }

    const result = await framePipeline.setStreamScale(streamId, parseInt(scale), async);
    res.json(result);
  } catch (error) {
    logger.error('Set scale error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:streamId/metrics', (req, res) => {
  try {
    const { streamId } = req.params;
    const { startTime, endTime } = req.query;
    
    const metrics = db.getQualityMetrics(streamId, startTime, endTime);
    
    res.json({
      success: true,
      streamId,
      metrics: metrics.map(m => ({
        ...m,
        timestamp: new Date(m.timestamp).getTime()
      }))
    });
  } catch (error) {
    logger.error('Get metrics error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:streamId/history', (req, res) => {
  try {
    const { streamId } = req.params;
    const stats = framePipeline.getStreamStats(streamId);
    
    if (!stats) {
      return res.status(404).json({ 
        success: false, 
        error: `Stream ${streamId} not found` 
      });
    }
    
    res.json({
      success: true,
      streamId,
      history: stats.history || {
        fps: [],
        delay: [],
        psnr: [],
        ssim: [],
        timestamps: []
      }
    });
  } catch (error) {
    logger.error('Get history error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
