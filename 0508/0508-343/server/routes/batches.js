const express = require('express');
const router = express.Router();
const db = require('../models');
const { Op } = require('sequelize');
const worker = require('../../worker');

router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, machineId, status, startDate, endDate } = req.query;
    const offset = (page - 1) * pageSize;

    const where = {};
    if (machineId) where.machineId = machineId;
    if (status) where.status = status;
    if (startDate && endDate) {
      where.startTime = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }

    const { count, rows } = await db.PulpBatch.findAndCountAll({
      where,
      order: [['startTime', 'DESC']],
      limit: parseInt(pageSize),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const batch = await db.PulpBatch.findByPk(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: '批次不存在' });
    }
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const batch = await db.PulpBatch.create(req.body);
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const batch = await db.PulpBatch.findByPk(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: '批次不存在' });
    }
    await batch.update(req.body);
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/flow-reading', async (req, res) => {
  try {
    const batch = await db.PulpBatch.findByPk(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: '批次不存在' });
    }

    const reading = await db.FlowMeterReading.create({
      batchId: batch.id,
      ...req.body
    });

    res.json({ success: true, data: reading });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/downtime-remark', async (req, res) => {
  try {
    const batch = await db.PulpBatch.findByPk(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: '批次不存在' });
    }

    const remark = await db.DowntimeRemark.create({
      batchId: batch.id,
      ...req.body
    });

    res.json({ success: true, data: remark });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/start-calculation', async (req, res) => {
  try {
    const batch = await db.PulpBatch.findByPk(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: '批次不存在' });
    }

    await batch.update({ status: 'processing' });
    worker.addTask('calculate', batch.id);
    worker.addTask('snapshot', batch.id);

    res.json({ success: true, message: '计算任务已提交' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/machines/list', async (req, res) => {
  try {
    const machines = await db.PulpBatch.findAll({
      attributes: ['machineId'],
      group: ['machineId'],
      order: [['machineId', 'ASC']]
    });

    res.json({
      success: true,
      data: machines.map(m => m.machineId)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;