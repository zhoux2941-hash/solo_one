const { EventEmitter } = require('events');
const crypto = require('crypto');

class USBDeviceManager extends EventEmitter {
  constructor(db, isDev = false) {
    super();
    this.db = db;
    this.isDev = isDev;
    this.devices = new Map();
    this.monitoringInterval = null;
    this.virtualDevice = null;
    this.usb = null;

    try {
      const usb = require('usb');
      this.usb = usb;
    } catch (e) {
      console.warn('usb模块未安装，将使用虚拟设备模式');
    }
  }

  startMonitoring() {
    this.loadKnownDevices();

    if (this.usb) {
      this.usb.on('attach', (device) => this.handleDeviceAttach(device));
      this.usb.on('detach', (device) => this.handleDeviceDetach(device));
      this.scanRealDevices();
    }

    this.monitoringInterval = setInterval(() => {
      this.monitorDeviceStatus();
    }, 2000);

    if (this.isDev || !this.usb) {
      setTimeout(() => {
        this.simulateDeviceConnect();
      }, 2000);
    }
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    if (this.usb) {
      this.usb.removeAllListeners('attach');
      this.usb.removeAllListeners('detach');
    }
  }

  loadKnownDevices() {
    const stmt = this.db.prepare('SELECT * FROM usb_devices');
    const devices = stmt.all();
    devices.forEach(d => {
      this.devices.set(d.id, { ...d, is_connected: 0 });
    });
  }

  scanRealDevices() {
    if (!this.usb) return;

    try {
      const devices = this.usb.getDeviceList();
      devices.forEach(device => {
        if (this.isFingerprintDevice(device)) {
          this.handleDeviceAttach(device);
        }
      });
    } catch (e) {
      console.error('扫描USB设备失败:', e);
    }
  }

  isFingerprintDevice(device) {
    const vid = device.deviceDescriptor.idVendor;
    const pid = device.deviceDescriptor.idProduct;

    const fingerprintDevices = [
      { vid: 0x1050, pid: 0x0407 },
      { vid: 0x1050, pid: 0x0406 },
      { vid: 0x0483, pid: 0x5740 },
      { vid: 0x045e, pid: 0x00bb },
      { vid: 0x0483, pid: 0x2016 }
    ];

    return fingerprintDevices.some(d => d.vid === vid && d.pid === pid);
  }

  handleDeviceAttach(device) {
    const descriptor = device.deviceDescriptor;
    const deviceInfo = {
      vendor_id: descriptor.idVendor,
      product_id: descriptor.idProduct,
      serial_number: this.getSerialNumber(device),
      manufacturer: device.manufacturer || 'Unknown',
      product: device.product || 'Fingerprint Reader',
      device_path: device.busNumber + ':' + device.deviceAddress,
      is_virtual: 0,
      is_connected: 1
    };

    this.upsertDevice(deviceInfo);
  }

  handleDeviceDetach(device) {
    const descriptor = device.deviceDescriptor;
    const stmt = this.db.prepare(`
      UPDATE usb_devices 
      SET is_connected = 0, last_seen = CURRENT_TIMESTAMP
      WHERE vendor_id = ? AND product_id = ?
    `);
    stmt.run(descriptor.idVendor, descriptor.idProduct);

    const findStmt = this.db.prepare(`
      SELECT * FROM usb_devices WHERE vendor_id = ? AND product_id = ?
    `);
    const dbDevice = findStmt.get(descriptor.idVendor, descriptor.idProduct);
    if (dbDevice) {
      this.devices.set(dbDevice.id, { ...dbDevice, is_connected: 0 });
      this.emit('device-disconnected', dbDevice);
    }
  }

  getSerialNumber(device) {
    try {
      return device.serialNumber || crypto.randomBytes(8).toString('hex');
    } catch (e) {
      return crypto.randomBytes(8).toString('hex');
    }
  }

  upsertDevice(deviceInfo) {
    const stmt = this.db.prepare(`
      INSERT INTO usb_devices (vendor_id, product_id, serial_number, manufacturer, product, device_path, is_virtual, is_connected, last_seen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(vendor_id, product_id, serial_number) DO UPDATE SET
        manufacturer = excluded.manufacturer,
        product = excluded.product,
        device_path = excluded.device_path,
        is_connected = excluded.is_connected,
        last_seen = CURRENT_TIMESTAMP
    `);

    const info = stmt.run(
      deviceInfo.vendor_id,
      deviceInfo.product_id,
      deviceInfo.serial_number,
      deviceInfo.manufacturer,
      deviceInfo.product,
      deviceInfo.device_path,
      deviceInfo.is_virtual,
      deviceInfo.is_connected
    );

    const selectStmt = this.db.prepare('SELECT * FROM usb_devices WHERE id = ?');
    const device = selectStmt.get(info.lastInsertRowid || info.changes > 0 ? 
      this.findDeviceId(deviceInfo) : info.lastInsertRowid);
    
    if (device) {
      this.devices.set(device.id, device);
      this.emit('device-connected', device);
    }
  }

  findDeviceId(deviceInfo) {
    const stmt = this.db.prepare(`
      SELECT id FROM usb_devices 
      WHERE vendor_id = ? AND product_id = ? AND serial_number = ?
    `);
    const result = stmt.get(deviceInfo.vendor_id, deviceInfo.product_id, deviceInfo.serial_number);
    return result ? result.id : null;
  }

  monitorDeviceStatus() {
    if (this.usb) {
      try {
        const currentDevices = this.usb.getDeviceList();
        const fingerprintDevices = currentDevices.filter(d => this.isFingerprintDevice(d));
        
        this.devices.forEach((device, id) => {
          if (!device.is_virtual) {
            const stillConnected = fingerprintDevices.some(d => 
              d.deviceDescriptor.idVendor === device.vendor_id &&
              d.deviceDescriptor.idProduct === device.product_id
            );
            
            if (!stillConnected && device.is_connected) {
              this.handleDeviceDetach({ deviceDescriptor: { 
                idVendor: device.vendor_id, 
                idProduct: device.product_id 
              }});
            }
          }
        });
      } catch (e) {
        console.error('监控设备状态失败:', e);
      }
    }
  }

  simulateDeviceConnect() {
    const virtualSerial = crypto.randomBytes(8).toString('hex');
    const deviceInfo = {
      vendor_id: 0x1050,
      product_id: 0x0407,
      serial_number: virtualSerial,
      manufacturer: 'Virtual Devices Inc.',
      product: 'Virtual Fingerprint Reader POS',
      device_path: 'virtual:0',
      is_virtual: 1,
      is_connected: 1
    };

    this.virtualDevice = deviceInfo;
    this.upsertDevice(deviceInfo);
  }

  simulateDeviceDisconnect() {
    if (this.virtualDevice) {
      const stmt = this.db.prepare(`
        UPDATE usb_devices 
        SET is_connected = 0, last_seen = CURRENT_TIMESTAMP
        WHERE vendor_id = ? AND product_id = ? AND serial_number = ?
      `);
      stmt.run(
        this.virtualDevice.vendor_id,
        this.virtualDevice.product_id,
        this.virtualDevice.serial_number
      );

      const findStmt = this.db.prepare(`
        SELECT * FROM usb_devices 
        WHERE vendor_id = ? AND product_id = ? AND serial_number = ?
      `);
      const dbDevice = findStmt.get(
        this.virtualDevice.vendor_id,
        this.virtualDevice.product_id,
        this.virtualDevice.serial_number
      );

      if (dbDevice) {
        this.devices.set(dbDevice.id, { ...dbDevice, is_connected: 0 });
        this.emit('device-disconnected', dbDevice);
      }

      this.virtualDevice = null;
    }
  }

  getDevices() {
    return Array.from(this.devices.values());
  }

  connectDevice(deviceId) {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error('设备不存在');
    }

    if (device.is_virtual) {
      return { success: true, device: this.virtualDevice };
    }

    if (this.usb) {
      const realDevice = this.usb.findByIds(device.vendor_id, device.product_id);
      if (realDevice) {
        return { success: true, device: realDevice };
      }
    }

    return { success: false, error: '无法连接到设备' };
  }

  getConnectedDevice() {
    return Array.from(this.devices.values()).find(d => d.is_connected === 1);
  }
}

module.exports = USBDeviceManager;
