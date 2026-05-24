const express = require('express');
const router = express.Router();
const reportExportService = require('../services/reportExport');

router.get('/batch/:batchId/export', async (req, res) => {
  try {
    await reportExportService.exportBatchReport(req.params.batchId, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/batch/:batchId/brief', async (req, res) => {
  try {
    await reportExportService.exportBatchBrief(req.params.batchId, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/batches/brief', async (req, res) => {
  try {
    let batchIds = req.body.batchIds || req.body;
    if (typeof batchIds === 'string') {
      batchIds = JSON.parse(batchIds);
    }
    if (!Array.isArray(batchIds) || batchIds.length === 0) {
      return res.status(400).json({ success: false, message: '请选择要导出的批次' });
    }
    await reportExportService.exportBatchBriefList(batchIds, res);
  } catch (error) {
    console.error('批量导出失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;