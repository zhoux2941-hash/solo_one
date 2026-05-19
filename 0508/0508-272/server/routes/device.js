const express = require('express');
const router = express.Router();

router.get('/list', async (req, res) => {
  try {
    const { status } = req.query;
    
    let whereClause = '';
    const params = [];
    
    if (status) {
      whereClause = 'WHERE status = ?';
      params.push(status);
    }
    
    const devices = await req.db.all(
      `SELECT d.*, f.version as current_firmware_version 
       FROM devices d 
       LEFT JOIN firmware f ON d.current_firmware_id = f.id 
       ${whereClause}
       ORDER BY d.created_at DESC`,
      params
    );

    res.json({ success: true, data: devices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { serialNumber, hardwareModel, portName, baudRate = 115200 } = req.body;

    if (!serialNumber) {
      return res.status(400).json({ 
        success: false, 
        error: '设备序列号不能为空' 
      });
    }

    const existing = await req.db.get(
      'SELECT id FROM devices WHERE serial_number = ?',
      [serialNumber]
    );

    if (existing) {
      await req.db.run(
        `UPDATE devices 
         SET port_name = ?, baud_rate = ?, hardware_model = ?, status = 'online', last_connect_time = ?
         WHERE serial_number = ?`,
        [portName || '', baudRate, hardwareModel || '', new Date().toISOString(), serialNumber]
      );
      
      const device = await req.db.get(
        'SELECT * FROM devices WHERE serial_number = ?',
        [serialNumber]
      );
      
      return res.json({ success: true, data: device });
    }

    const result = await req.db.run(
      `INSERT INTO devices (serial_number, hardware_model, port_name, baud_rate, status, last_connect_time)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [serialNumber, hardwareModel || '', portName || '', baudRate, 'online', new Date().toISOString()]
    );

    const device = await req.db.get('SELECT * FROM devices WHERE id = ?', [result.lastID]);

    res.json({ success: true, data: device });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { hardwareModel, portName, baudRate, status } = req.body;

    const updates = [];
    const params = [];

    if (hardwareModel !== undefined) {
      updates.push('hardware_model = ?');
      params.push(hardwareModel);
    }

    if (portName !== undefined) {
      updates.push('port_name = ?');
      params.push(portName);
    }

    if (baudRate !== undefined) {
      updates.push('baud_rate = ?');
      params.push(baudRate);
    }

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: '没有需要更新的字段' 
      });
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString(), id);

    await req.db.run(
      `UPDATE devices SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const device = await req.db.get('SELECT * FROM devices WHERE id = ?', [id]);

    res.json({ success: true, data: device });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await req.db.run('DELETE FROM devices WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/update-status/batch', async (req, res) => {
  try {
    const { ports, status } = req.body;
    
    if (!ports || ports.length === 0) {
      return res.json({ success: true });
    }

    const placeholders = ports.map(() => '?').join(',');
    
    await req.db.run(
      `UPDATE devices SET status = ?, updated_at = ? WHERE port_name IN (${placeholders})`,
      [status, new Date().toISOString(), ...ports]
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
