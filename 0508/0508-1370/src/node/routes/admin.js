const express = require('express');
const router = express.Router();
const zmqClient = require('../services/zmqClient');
const framePipeline = require('../services/framePipeline');
const webrtcService = require('../services/webrtcService');
const db = require('../services/database');
const logger = require('../utils/logger');
const config = require('../config');

router.get('/status', async (req, res) => {
  try {
    const result = await zmqClient.getStats();
    const streamStats = framePipeline.getStreamStats();
    const webrtcStats = webrtcService.getStats();
    const systemMetrics = db.getSystemMetrics(10);

    res.json({
      success: true,
      status: {
        zmqConnected: zmqClient.connected,
        pythonStats: result?.server_stats || {},
        streamStats,
        webrtcStats,
        systemMetrics: systemMetrics.map(m => ({
          ...m,
          timestamp: new Date(m.timestamp).getTime()
        })),
        config: {
          maxStreams: config.media.maxStreams,
          targetFps: config.media.targetFps,
          maxDelayMs: config.media.maxDelayMs,
          allowedScales: config.superres.allowedScales,
          defaultScale: config.superres.defaultScale,
          useGpu: config.gpu.useGpu
        }
      }
    });
  } catch (error) {
    logger.error('Get status error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/streams', (req, res) => {
  try {
    const streams = framePipeline.getActiveStreams();
    res.json({
      success: true,
      streams
    });
  } catch (error) {
    logger.error('Get admin streams error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/streams/:streamId', (req, res) => {
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
    logger.error('Get admin stream error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/streams/:streamId/scale', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { scale } = req.body;
    
    if (!scale) {
      return res.status(400).json({ 
        success: false, 
        error: 'scale is required' 
      });
    }

    const scaleNum = parseInt(scale);
    if (!config.superres.allowedScales.includes(scaleNum)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid scale. Allowed: ${config.superres.allowedScales.join(', ')}` 
      });
    }

    const result = await zmqClient.setScale(streamId, scaleNum);
    
    if (result.success) {
      framePipeline.setStreamScale(streamId, scaleNum);
      logger.info('Scale changed via admin API', { streamId, scale: scaleNum });
    }
    
    res.json(result);
  } catch (error) {
    logger.error('Set scale admin error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/streams/:streamId', (req, res) => {
  try {
    const { streamId } = req.params;
    
    for (const [peerId, info] of webrtcService.incomingStreams) {
      if (info.streamId === streamId) {
        webrtcService.closeConnection(peerId);
        break;
      }
    }
    
    framePipeline.unregisterStream(streamId);
    
    logger.info('Stream terminated via admin API', { streamId });
    
    res.json({ success: true, streamId });
  } catch (error) {
    logger.error('Terminate stream error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/metrics/system', (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const metrics = db.getSystemMetrics(parseInt(limit));
    
    res.json({
      success: true,
      metrics: metrics.map(m => ({
        ...m,
        timestamp: new Date(m.timestamp).getTime()
      }))
    });
  } catch (error) {
    logger.error('Get system metrics error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/metrics/quality/:streamId', (req, res) => {
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
    logger.error('Get quality metrics error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/python/ping', async (req, res) => {
  try {
    const result = await zmqClient.ping();
    res.json(result);
  } catch (error) {
    logger.error('Python ping error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/python/stats', async (req, res) => {
  try {
    const result = await zmqClient.getStats();
    res.json(result);
  } catch (error) {
    logger.error('Python stats error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
