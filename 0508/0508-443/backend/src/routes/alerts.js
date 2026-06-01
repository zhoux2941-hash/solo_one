const express = require('express');
const router = express.Router();
const alertManager = require('../modules/alertManager');

router.get('/', async (req, res) => {
  try {
    const filters = {
      streamId: req.query.streamId,
      streamAddress: req.query.streamAddress,
      startTime: req.query.startTime,
      endTime: req.query.endTime,
      type: req.query.type
    };
    
    const alerts = await alertManager.getAlerts(filters);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const alert = await alertManager.getAlert(req.params.id);
    if (alert) {
      res.json(alert);
    } else {
      res.status(404).json({ error: 'Alert not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/acknowledge', async (req, res) => {
  try {
    const alert = await alertManager.acknowledgeAlert(req.params.id);
    if (alert) {
      res.json(alert);
    } else {
      res.status(404).json({ error: 'Alert not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await alertManager.deleteAlert(req.params.id);
    if (deleted) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Alert not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
