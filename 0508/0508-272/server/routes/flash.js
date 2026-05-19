const express = require('express');
const router = express.Router();
const flashService = require('../services/flashService');

router.post('/start', async (req, res) => {
  try {
    const { firmwareId, ports, operatorId, config } = req.body;

    if (!firmwareId || !ports || ports.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: '请选择固件和至少一个烧录端口' 
      });
    }

    const task = await flashService.createFlashTask(
      req.db,
      firmwareId,
      ports,
      operatorId,
      config || {}
    );

    await req.db.run(
      `INSERT INTO operation_logs (user_id, action, module, details)
       VALUES (?, ?, ?, ?)`,
      [operatorId || null, '开始烧录', '烧录管理', `创建烧录任务: ${task.taskId}, 设备数量: ${ports.length}`]
    );

    flashService.startFlashTask(task.taskId);

    res.json({ 
      success: true, 
      data: { taskId: task.taskId } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/cancel', async (req, res) => {
  try {
    const { taskId, operatorId } = req.body;
    
    const success = flashService.cancelFlashTask(taskId);
    
    if (success) {
      await req.db.run(
        `INSERT INTO operation_logs (user_id, action, module, details)
         VALUES (?, ?, ?, ?)`,
        [operatorId || null, '取消烧录', '烧录管理', `取消烧录任务: ${taskId}`]
      );
    }

    res.json({ success });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/retry', async (req, res) => {
  try {
    const { taskId, operatorId } = req.body;
    
    const result = await flashService.retryFailedPorts(taskId);
    
    await req.db.run(
      `INSERT INTO operation_logs (user_id, action, module, details)
       VALUES (?, ?, ?, ?)`,
      [operatorId || null, '重试烧录', '烧录管理', `重试任务: ${taskId}, 设备数量: ${result.retryCount}`]
    );

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/status/:taskId', (req, res) => {
  try {
    const taskStatus = flashService.getTaskStatus(req.params.taskId);
    
    if (!taskStatus) {
      return res.status(404).json({ success: false, error: '任务不存在' });
    }

    res.json({ success: true, data: taskStatus });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/config', (req, res) => {
  try {
    const scheduler = flashService.getScheduler();
    const config = scheduler ? scheduler.config : flashService.DEFAULT_CONFIG;
    
    res.json({ 
      success: true, 
      data: config 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/config', (req, res) => {
  try {
    const scheduler = flashService.getScheduler();
    if (scheduler) {
      scheduler.setConfig(req.body);
    }
    
    res.json({ 
      success: true, 
      data: scheduler ? scheduler.config : flashService.DEFAULT_CONFIG 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    const tasks = await req.db.all(
      `SELECT t.*, f.file_name, f.version, u.username as operator_name
       FROM flash_tasks t
       LEFT JOIN firmware f ON t.firmware_id = f.id
       LEFT JOIN users u ON t.operator_id = u.id
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(pageSize), parseInt(offset)]
    );

    const totalResult = await req.db.get(
      'SELECT COUNT(*) as total FROM flash_tasks'
    );

    res.json({
      success: true,
      data: {
        list: tasks,
        total: totalResult.total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/records/:taskId', async (req, res) => {
  try {
    const records = await req.db.all(
      `SELECT r.*, f.file_name, f.version
       FROM flash_records r
       LEFT JOIN firmware f ON r.firmware_id = f.id
       WHERE r.task_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.taskId]
    );

    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
