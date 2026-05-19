const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const EventEmitter = require('events');

const serialConnections = new Map();
const devicePortMap = new Map();
const serialEmitter = new EventEmitter();

function generateDeviceId(portInfo) {
  if (portInfo.serialNumber) {
    return `SN_${portInfo.serialNumber}`;
  }
  if (portInfo.pnpId) {
    return `PNP_${portInfo.pnpId}`;
  }
  if (portInfo.vendorId && portInfo.productId) {
    return `VID_${portInfo.vendorId}_PID_${portInfo.productId}`;
  }
  return `PORT_${portInfo.path}`;
}

async function scanPorts() {
  try {
    const ports = await SerialPort.list();
    const result = ports.map(port => {
      const deviceId = generateDeviceId(port);
      return {
        path: port.path,
        manufacturer: port.manufacturer || '未知厂商',
        serialNumber: port.serialNumber,
        pnpId: port.pnpId,
        vendorId: port.vendorId,
        productId: port.productId,
        deviceId,
        friendlyName: port.serialNumber 
          ? `${port.path} (SN: ${port.serialNumber.substring(0, 8)}...)` 
          : port.manufacturer 
            ? `${port.path} (${port.manufacturer})` 
            : port.path
      };
    });
    
    result.forEach(port => {
      devicePortMap.set(port.deviceId, port.path);
    });
    
    return result;
  } catch (error) {
    throw new Error(`扫描串口失败: ${error.message}`);
  }
}

function getDeviceByPort(portPath) {
  for (const [deviceId, path] of devicePortMap.entries()) {
    if (path === portPath) {
      return deviceId;
    }
  }
  return null;
}

function getPortByDevice(deviceId) {
  return devicePortMap.get(deviceId);
}

function getDevicePortMap() {
  const map = {};
  for (const [deviceId, port] of devicePortMap.entries()) {
    map[deviceId] = port;
  }
  return map;
}

async function connectPort(portName, options = {}) {
  const {
    baudRate = 115200,
    dataBits = 8,
    stopBits = 1,
    parity = 'none'
  } = options;

  if (serialConnections.has(portName)) {
    throw new Error(`串口 ${portName} 已连接`);
  }

  return new Promise((resolve, reject) => {
    const port = new SerialPort({
      path: portName,
      baudRate,
      dataBits,
      stopBits,
      parity,
      autoOpen: false
    });

    const parser = port.pipe(new ReadlineParser({ delimiter: '\n', encoding: 'utf8' }));

    port.open((err) => {
      if (err) {
        reject(new Error(`打开串口失败: ${err.message}`));
        return;
      }

      const connectionInfo = { 
        port, 
        parser, 
        options,
        connectTime: new Date(),
        baudRate
      };
      serialConnections.set(portName, connectionInfo);

      parser.on('data', (data) => {
        serialEmitter.emit('data', { 
          port: portName, 
          data: data.toString().trim(), 
          direction: 'rx',
          timestamp: new Date().toISOString()
        });
      });

      port.on('error', (err) => {
        serialEmitter.emit('error', { port: portName, error: err.message });
      });

      port.on('close', () => {
        serialConnections.delete(portName);
        serialEmitter.emit('disconnect', { port: portName });
      });

      resolve({
        port: portName,
        baudRate,
        status: 'connected',
        connectTime: connectionInfo.connectTime
      });
    });
  });
}

async function disconnectPort(portName) {
  const connection = serialConnections.get(portName);
  if (!connection) {
    throw new Error(`串口 ${portName} 未连接`);
  }

  return new Promise((resolve, reject) => {
    connection.port.close((err) => {
      if (err) {
        reject(new Error(`关闭串口失败: ${err.message}`));
      } else {
        serialConnections.delete(portName);
        resolve({ port: portName, status: 'disconnected' });
      }
    });
  });
}

async function sendData(portName, data) {
  const connection = serialConnections.get(portName);
  if (!connection) {
    throw new Error(`串口 ${portName} 未连接`);
  }

  return new Promise((resolve, reject) => {
    connection.port.write(data, (err) => {
      if (err) {
        reject(new Error(`发送数据失败: ${err.message}`));
      } else {
        serialEmitter.emit('data', { port: portName, data: data.toString(), direction: 'tx' });
        resolve({ success: true });
      }
    });
  });
}

function getConnection(portName) {
  return serialConnections.get(portName);
}

function getAllConnections() {
  const connections = [];
  serialConnections.forEach((conn, port) => {
    connections.push({
      port,
      options: conn.options,
      status: 'connected'
    });
  });
  return connections;
}

function getEmitter() {
  return serialEmitter;
}

async function closeAllPorts() {
  const promises = [];
  serialConnections.forEach((conn, port) => {
    promises.push(disconnectPort(port));
  });
  await Promise.allSettled(promises);
}

async function scanPortsWithDevices(db) {
  const ports = await scanPorts();
  
  for (const port of ports) {
    const device = await db.get(
      'SELECT * FROM devices WHERE serial_number = ? OR pnp_id = ? OR port_name = ?',
      [port.serialNumber || '', port.pnpId || '', port.path]
    );
    
    if (device) {
      port.deviceInfo = device;
      port.deviceId = `DB_${device.id}`;
      port.displayName = `${device.serial_number || port.path} - ${device.hardware_model || '未知型号'}`;
      
      if (device.port_name !== port.path) {
        await db.run(
          'UPDATE devices SET port_name = ?, updated_at = ? WHERE id = ?',
          [port.path, new Date().toISOString(), device.id]
        );
      }
    } else {
      port.displayName = port.friendlyName;
      port.deviceInfo = null;
    }
  }
  
  return ports;
}

async function identifyDevice(portName, timeout = 5000) {
  const connection = serialConnections.get(portName);
  if (!connection) {
    throw new Error(`串口 ${portName} 未连接`);
  }

  return new Promise((resolve, reject) => {
    const identifyCommands = [
      'AT+ID?\r\n',
      '*IDN?\r\n',
      '?\r\n',
      'getinfo\r\n'
    ];
    
    let response = null;
    let cmdIndex = 0;
    
    const dataHandler = (data) => {
      if (data.port === portName && data.direction === 'rx') {
        response = data.data;
        serialEmitter.removeListener('data', dataHandler);
        resolve({
          port: portName,
          response: response,
          success: true
        });
      }
    };
    
    serialEmitter.on('data', dataHandler);
    
    const sendNext = () => {
      if (cmdIndex < identifyCommands.length && !response) {
        connection.port.write(identifyCommands[cmdIndex]);
        cmdIndex++;
        setTimeout(sendNext, 500);
      }
    };
    
    sendNext();
    
    setTimeout(() => {
      serialEmitter.removeListener('data', dataHandler);
      if (response) {
        resolve({
          port: portName,
          response: response,
          success: true
        });
      } else {
        resolve({
          port: portName,
          response: null,
          success: false,
          message: '设备识别超时'
        });
      }
    }, timeout);
  });
}

module.exports = {
  scanPorts,
  scanPortsWithDevices,
  connectPort,
  disconnectPort,
  sendData,
  getConnection,
  getAllConnections,
  getEmitter,
  closeAllPorts,
  getDeviceByPort,
  getPortByDevice,
  getDevicePortMap,
  identifyDevice,
  generateDeviceId
};
