const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const webrtcService = require('../services/webrtcService');
const logger = require('../utils/logger');

router.post('/publish', async (req, res) => {
  try {
    const { sdp, type, peerId } = req.body;
    
    if (!sdp || !type) {
      return res.status(400).json({ 
        success: false, 
        error: 'SDP and type are required' 
      });
    }

    const clientPeerId = peerId || `publisher_${uuidv4().slice(0, 8)}`;
    
    const result = await webrtcService.createPublisher(clientPeerId, sdp, type);
    
    if (result.success) {
      result.peerId = clientPeerId;
    }
    
    res.json(result);
  } catch (error) {
    logger.error('Publish error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/subscribe', async (req, res) => {
  try {
    const { streamId, sdp, type, peerId } = req.body;
    
    if (!streamId || !sdp || !type) {
      return res.status(400).json({ 
        success: false, 
        error: 'streamId, sdp and type are required' 
      });
    }

    const clientPeerId = peerId || `viewer_${uuidv4().slice(0, 8)}`;
    
    const result = await webrtcService.createViewer(clientPeerId, streamId, sdp, type);
    
    if (result.success) {
      result.peerId = `${clientPeerId}_${result.viewerId}`;
    }
    
    res.json(result);
  } catch (error) {
    logger.error('Subscribe error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ice', async (req, res) => {
  try {
    const { peerId, candidate } = req.body;
    
    if (!peerId || !candidate) {
      return res.status(400).json({ 
        success: false, 
        error: 'peerId and candidate are required' 
      });
    }

    const result = await webrtcService.addIceCandidate(peerId, candidate);
    res.json(result);
  } catch (error) {
    logger.error('ICE candidate error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/close', async (req, res) => {
  try {
    const { peerId } = req.body;
    
    if (!peerId) {
      return res.status(400).json({ 
        success: false, 
        error: 'peerId is required' 
      });
    }

    const result = webrtcService.closeConnection(peerId);
    res.json(result);
  } catch (error) {
    logger.error('Close connection error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
