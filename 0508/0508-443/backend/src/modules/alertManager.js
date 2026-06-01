const config = require('../config');
const db = require('../database');

let io = null;
const lastAlertTime = new Map();

function setSocketIO(socketIO) {
  io = socketIO;
}

async function checkForAlerts(stream, metrics) {
  const now = Date.now();
  const lastTime = lastAlertTime.get(stream.id) || 0;
  
  if (now - lastTime < config.alert.cooldownPeriod) {
    return;
  }

  const alerts = [];

  if (metrics.packetLossRate > config.alert.maxPacketLossRate) {
    alerts.push({
      type: 'packet_loss',
      severity: 'high',
      message: `丢包率过高: ${(metrics.packetLossRate * 100).toFixed(2)}%`,
      value: metrics.packetLossRate,
      threshold: config.alert.maxPacketLossRate
    });
  }

  if (stream.expectedBitrate && metrics.bitrate > 0) {
    const minBitrate = stream.expectedBitrate * config.alert.minBitrateRatio;
    if (metrics.bitrate < minBitrate) {
      alerts.push({
        type: 'low_bitrate',
        severity: 'medium',
        message: `码率过低: ${(metrics.bitrate / 1000000).toFixed(2)} Mbps`,
        value: metrics.bitrate,
        threshold: minBitrate
      });
    }
  }

  if (!metrics.isReceiving) {
    alerts.push({
      type: 'no_signal',
      severity: 'critical',
      message: '无信号输入',
      value: 0,
      threshold: 1
    });
  }

  for (const alert of alerts) {
    await createAlert(stream, alert);
    lastAlertTime.set(stream.id, now);
  }
}

async function createAlert(stream, alertData) {
  const alert = await db.alerts.create({
    streamId: stream.id,
    streamAddress: stream.address,
    streamName: stream.name,
    type: alertData.type,
    severity: alertData.severity,
    message: alertData.message,
    value: alertData.value,
    threshold: alertData.threshold
  });

  if (io) {
    io.emit('newAlert', alert);
  }

  console.log(`Alert created: ${alert.type} - ${stream.address}`);
  return alert;
}

async function getAlerts(filters = {}) {
  return await db.alerts.getAll(filters);
}

async function getAlert(alertId) {
  return await db.alerts.getById(alertId);
}

async function acknowledgeAlert(alertId) {
  return await db.alerts.acknowledge(alertId);
}

async function deleteAlert(alertId) {
  return await db.alerts.delete(alertId);
}

module.exports = {
  setSocketIO,
  checkForAlerts,
  createAlert,
  getAlert,
  getAlerts,
  acknowledgeAlert,
  deleteAlert
};
