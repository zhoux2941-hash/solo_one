const express = require('express');
const router = express.Router();

router.get('/operation', async (req, res) => {
  try {
    const { page = 1, pageSize = 50, userId, module } = req.query;
    const offset = (page - 1) * pageSize;
    
    let whereClause = '';
    const params = [];
    
    if (userId) {
      whereClause += 'WHERE user_id = ?';
      params.push(userId);
    }
    
    if (module) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += 'module = ?';
      params.push(module);
    }
    
    params.push(parseInt(pageSize), parseInt(offset));
    
    const logs = await req.db.all(
      `SELECT * FROM operation_logs 
       ${whereClause}
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      params
    );

    const totalResult = await req.db.get(
      `SELECT COUNT(*) as total FROM operation_logs ${whereClause}`,
      params.slice(0, params.length - 2)
    );

    res.json({
      success: true,
      data: {
        list: logs,
        total: totalResult.total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/debug', async (req, res) => {
  try {
    const { page = 1, pageSize = 100, portName } = req.query;
    const offset = (page - 1) * pageSize;
    
    let whereClause = '';
    const params = [];
    
    if (portName) {
      whereClause = 'WHERE port_name = ?';
      params.push(portName);
    }
    
    params.push(parseInt(pageSize), parseInt(offset));
    
    const logs = await req.db.all(
      `SELECT * FROM debug_logs 
       ${whereClause}
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      params
    );

    const totalResult = await req.db.get(
      `SELECT COUNT(*) as total FROM debug_logs ${whereClause}`,
      params.slice(0, params.length - 2)
    );

    res.json({
      success: true,
      data: {
        list: logs,
        total: totalResult.total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/debug/clear', async (req, res) => {
  try {
    await req.db.run('DELETE FROM debug_logs');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
