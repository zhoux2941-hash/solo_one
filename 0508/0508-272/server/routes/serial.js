const express = require('express');
const router = express.Router();
const serialService = require('../services/serialService');

router.get('/scan', async (req, res) => {
  try {
    const ports = await serialService.scanPorts();
    res.json({ success: true, data: ports });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/scan-with-devices', async (req, res) => {
  try {
    const ports = await serialService.scanPortsWithDevices(req.db);
    res.json({ success: true, data: ports });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/connect', async (req, res) => {
  try {
    const { port, baudRate = 115200, deviceId } = req.body;
    
    if (!port) {
      return res.status(400).json({ 
        success: false, 
        error: '请指定串口' 
      });
    }
    
    let actualPort = port;
    if (deviceId) {
      const mappedPort = serialService.getPortByDevice(deviceId);
      if (mappedPort) {
        actualPort = mappedPort;
      }
    }
    
    const result = await serialService.connectPort(actualPort, { baudRate });
    
    if (deviceId) {
      await req.db.run(
        'UPDATE devices SET status = ?, last_connect_time = ?, port_name = ? WHERE id = ?',
        ['online', new Date().toISOString(), actualPort, deviceId]
      );
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/disconnect', async (req, res) => {
  try {
    const { port, deviceId } = req.body;
    
    let actualPort = port;
    if (deviceId && !port) {
      const mappedPort = serialService.getPortByDevice(deviceId);
      if (mappedPort) {
        actualPort = mappedPort;
      } else {
        return res.status(400).json({ 
          success: false, 
          error: '未找到设备对应的串口' 
        });
      }
    }
    
    const result = await serialService.disconnectPort(actualPort);
    
    if (deviceId) {
      await req.db.run(
        'UPDATE devices SET status = ?, updated_at = ? WHERE id = ?',
        ['offline', new Date().toISOString(), deviceId]
      );
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/send', async (req, res) => {
  try {
    const { port, data, deviceId } = req.body;
    
    let actualPort = port;
    if (deviceId && !port) {
      const mappedPort = serialService.getPortByDevice(deviceId);
      if (mappedPort) {
        actualPort = mappedPort;
      } else {
        return res.status(400).json({ 
          success: false, 
          error: '未找到设备对应的串口' 
        });
      }
    }
    
    await serialService.sendData(actualPort, data);
    
    await req.db.run(
      'INSERT INTO debug_logs (port_name, direction, data) VALUES (?, ?, ?)',
      [actualPort, 'tx', data.toString()]
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/connections', async (req, res) => {
  try {
    const connections = serialService.getAllConnections();
    
    const result = [];
    for (const conn of connections) {
      const deviceId = serialService.getDeviceByPort(conn.port);
      const device = deviceId ? await req.db.get(
        'SELECT * FROM devices WHERE id = ?',
        [parseInt(deviceId.replace('DB_', ''))]
      ).catch(() => null) : null;
      
      result.push({
        ...conn,
        device,
        deviceId
      });
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/identify', async (req, res) => {
  try {
    const { port, timeout = 5000 } = req.body;
    const result = await serialService.identifyDevice(port, timeout);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/register-device', async (req, res) => {
  try {
    const { portName, serialNumber, hardwareModel, pnpId, vendorId, productId, manufacturer } = req.body;
    
    if (!portName) {
      return res.status(400).json({ 
        success: false, 
        error: '请指定串口' 
      });
    }
    
    let device = null;
    
    if (serialNumber) {
      device = await req.db.get(
        'SELECT * FROM devices WHERE serial_number = ?',
        [serialNumber]
      );
    }
    
    if (!device && pnpId) {
      device = await req.db.get(
        'SELECT * FROM devices WHERE pnp_id = ?',
        [pnpId]
      );
    }
    
    if (!device && vendorId && productId) {
      device = await req.db.get(
        'SELECT * FROM devices WHERE vendor_id = ? AND product_id = ?',
        [vendorId, productId]
      );
    }
    
    const now = new Date().toISOString();
    
    if (device) {
      await req.db.run(
        `UPDATE devices 
         SET port_name = ?, hardware_model = COALESCE(?, hardware_model), 
             pnp_id = COALESCE(?, pnp_id), vendor_id = COALESCE(?, vendor_id),
             product_id = COALESCE(?, product_id), manufacturer = COALESCE(?, manufacturer),
             status = 'online', last_connect_time = ?, updated_at = ?
         WHERE id = ?`,
        [portName, hardwareModel || null, pnpId || null, vendorId || null, 
         productId || null, manufacturer || null, now, now, device.id]
      );
      
      device = await req.db.get('SELECT * FROM devices WHERE id = ?', [device.id]);
    } else {
      const finalSerialNumber = serialNumber || `DEV_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      
      const result = await req.db.run(
        `INSERT INTO devices (serial_number, hardware_model, port_name, pnp_id, vendor_id, product_id, manufacturer, status, last_connect_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [finalSerialNumber, hardwareModel || '', portName, pnpId || '', vendorId || '', 
         productId || '', manufacturer || '', 'online', now]
      );
      
      device = await req.db.get('SELECT * FROM devices WHERE id = ?', [result.lastID]);
    }
    
    res.json({ success: true, data: device });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/device-map', (req, res) => {
  try {
    const map = serialService.getDevicePortMap();
    res.json({ success: true, data: map });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
