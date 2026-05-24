const express = require('express');
const router = express.Router();
const db = require('../models');

router.get('/batch/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;

    const batch = await db.PulpBatch.findByPk(batchId);
    if (!batch) {
      return res.status(404).json({ success: false, message: '批次不存在' });
    }

    const readings = await db.FlowMeterReading.findAll({
      where: { batchId },
      order: [['readingTime', 'ASC']]
    });

    const remarks = await db.DowntimeRemark.findAll({
      where: { batchId },
      order: [['eventTime', 'ASC']]
    });

    const segments = await db.LossSegment.findAll({
      where: { batchId },
      order: [['sortOrder', 'ASC'], ['startTime', 'ASC']]
    });

    const snapshots = await db.LossSnapshot.findAll({
      where: { batchId },
      order: [['snapshotTime', 'ASC']]
    });

    const timelineEvents = [];

    readings.forEach(r => {
      timelineEvents.push({
        id: `reading-${r.id}`,
        type: 'flow',
        time: r.readingTime,
        data: {
          flowRate: r.flowRate,
          totalFlow: r.totalFlow,
          concentration: r.concentration,
          temperature: r.temperature
        }
      });
    });

    remarks.forEach(r => {
      timelineEvents.push({
        id: `remark-${r.id}`,
        type: 'remark',
        eventType: r.eventType,
        time: r.eventTime,
        data: {
          remark: r.remark,
          operator: r.operator,
          duration: r.duration
        }
      });
    });

    segments.forEach(s => {
      timelineEvents.push({
        id: `segment-${s.id}`,
        type: 'segment',
        segmentType: s.segmentType,
        time: s.startTime,
        endTime: s.endTime,
        data: {
          segmentName: s.segmentName,
          duration: s.duration,
          remark: s.remark
        }
      });
    });

    timelineEvents.sort((a, b) => new Date(a.time) - new Date(b.time));

    res.json({
      success: true,
      data: {
        batch: batch.toJSON(),
        timelineEvents,
        readings: readings.map(r => r.toJSON()),
        remarks: remarks.map(r => r.toJSON()),
        segments: segments.map(s => s.toJSON()),
        snapshots: snapshots.map(s => s.toJSON())
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;