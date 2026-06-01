const express = require('express');
const router = express.Router();
const db = require('../database');
const streamMonitor = require('../modules/streamMonitor');

router.get('/', async (req, res) => {
  try {
    const streams = await db.streams.getAll();
    const streamsWithMetrics = streams.map(stream => {
      const metrics = streamMonitor.getStreamMetrics(stream.id);
      return {
        ...stream,
        isMonitoring: streamMonitor.isMonitoring(stream.id),
        metrics
      };
    });
    res.json(streamsWithMetrics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const stream = await db.streams.getById(req.params.id);
    if (stream) {
      const metrics = streamMonitor.getStreamMetrics(stream.id);
      res.json({
        ...stream,
        isMonitoring: streamMonitor.isMonitoring(stream.id),
        metrics
      });
    } else {
      res.status(404).json({ error: 'Stream not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/metrics', async (req, res) => {
  try {
    const metrics = streamMonitor.getStreamMetrics(req.params.id);
    if (metrics) {
      res.json(metrics);
    } else {
      res.status(404).json({ error: 'Stream not being monitored' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, address, expectedBitrate, enabled = true } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const existing = await db.streams.getByAddress(address);
    if (existing) {
      return res.status(400).json({ error: 'Stream already exists' });
    }

    const stream = await db.streams.create({
      name: name || address,
      address,
      expectedBitrate: expectedBitrate || 5000000,
      enabled
    });

    if (enabled) {
      streamMonitor.startMonitor(stream);
    }

    res.json(stream);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, address, expectedBitrate, enabled } = req.body;
    
    const stream = await db.streams.getById(req.params.id);
    if (stream) {
      const updated = await db.streams.update(req.params.id, {
        name: name || stream.name,
        address: address || stream.address,
        expectedBitrate: expectedBitrate || stream.expectedBitrate,
        enabled: enabled !== undefined ? enabled : stream.enabled
      });

      if (enabled === true && !streamMonitor.isMonitoring(req.params.id)) {
        streamMonitor.startMonitor(updated);
      } else if (enabled === false) {
        streamMonitor.stopMonitor(req.params.id);
      }

      res.json(updated);
    } else {
      res.status(404).json({ error: 'Stream not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    streamMonitor.stopMonitor(req.params.id);
    const deleted = await db.streams.delete(req.params.id);
    if (deleted) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Stream not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/start', async (req, res) => {
  try {
    const stream = await db.streams.getById(req.params.id);
    if (stream) {
      streamMonitor.startMonitor(stream);
      await db.streams.update(req.params.id, { enabled: true });
      res.json({ success: true, message: 'Monitoring started' });
    } else {
      res.status(404).json({ error: 'Stream not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/stop', async (req, res) => {
  try {
    streamMonitor.stopMonitor(req.params.id);
    await db.streams.update(req.params.id, { enabled: false });
    res.json({ success: true, message: 'Monitoring stopped' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
