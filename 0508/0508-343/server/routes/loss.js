const express = require('express');
const router = express.Router();
const db = require('../models');
const lossCalculationService = require('../services/lossCalculation');

router.get('/batch/:batchId', async (req, res) => {
  try {
    const data = await lossCalculationService.getLossReviewData(req.params.batchId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/batch/:batchId/segments', async (req, res) => {
  try {
    const { batchId } = req.params;

    const segments = await db.LossSegment.findAll({
      where: { batchId },
      order: [['sortOrder', 'ASC'], ['startTime', 'ASC']]
    });

    const calculations = await db.StageCalculation.findAll({
      where: { batchId },
      order: [['startTime', 'ASC']]
    });

    const result = segments.map(segment => {
      const segCalcs = calculations.filter(c => c.segmentId === segment.id);
      return {
        ...segment.toJSON(),
        calculations: segCalcs.map(c => c.toJSON()),
        segmentLoss: segCalcs.reduce((sum, c) => sum + parseFloat(c.lossAmount || 0), 0).toFixed(2)
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/batch/:batchId/snapshots', async (req, res) => {
  try {
    const { batchId } = req.params;

    const snapshots = await db.LossSnapshot.findAll({
      where: { batchId },
      order: [['snapshotTime', 'ASC']]
    });

    res.json({ success: true, data: snapshots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/recalculate/:batchId', async (req, res) => {
  try {
    const result = await lossCalculationService.calculateBatchLoss(req.params.batchId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;