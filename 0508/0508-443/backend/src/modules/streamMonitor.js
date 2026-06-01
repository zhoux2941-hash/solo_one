const { spawn, execFile } = require('child_process');
const config = require('../config');
const db = require('../database');
const alertManager = require('./alertManager');

let io = null;
const monitors = new Map();
const streamMetrics = new Map();
let broadcastInterval = null;

function setSocketIO(socketIO) {
  io = socketIO;
}

async function loadStreamsFromDB() {
  const streams = await db.streams.getAll();
  for (const stream of streams) {
    if (stream.enabled) {
      startMonitor(stream);
    }
  }
  startBroadcast();
}

function startBroadcast() {
  if (broadcastInterval) {
    clearInterval(broadcastInterval);
  }
  broadcastInterval = setInterval(async () => {
    await processMetricsAndAlerts();
    const allMetrics = getAllStreamMetrics();
    if (io && allMetrics.length > 0) {
      io.emit('allStreamMetrics', allMetrics);
    }
  }, config.monitoring.interval);
}

function startMonitor(stream) {
  if (monitors.has(stream.id)) {
    stopMonitor(stream.id);
  }

  const metrics = initMetrics(stream);
  streamMetrics.set(stream.id, metrics);

  startFfprobeMonitor(stream, metrics);

  console.log(`Started monitoring: ${stream.address}`);
}

function startFfprobeMonitor(stream, metrics) {
  const args = [
    '-v', 'info',
    '-i', stream.address,
    '-show_entries', 'stream=codec_name,codec_type,width,height,r_frame_rate,bit_rate',
    '-show_entries', 'format=bit_rate',
    '-of', 'json',
    '-timeout', '3000000',
    '-rw_timeout', '5000000'
  ];

  const ffprobe = spawn(config.ffprobePath, args);
  let restartTimer = null;
  let lastDataTime = Date.now();

  const restart = () => {
    if (monitors.has(stream.id) && monitors.get(stream.id).ffprobe === ffprobe) {
      metrics.isReceiving = false;
      metrics.bitrate = 0;
      
      setTimeout(() => {
        if (monitors.has(stream.id)) {
          const monitor = monitors.get(stream.id);
          if (monitor.stream.enabled) {
            startFfprobeMonitor(monitor.stream, metrics);
          }
        }
      }, 2000);
    }
  };

  ffprobe.stdout.on('data', (data) => {
    lastDataTime = Date.now();
    try {
      const output = data.toString();
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const probeData = JSON.parse(jsonMatch[0]);
        parseProbeData(probeData, metrics);
      }
    } catch (e) {
    }
  });

  ffprobe.stderr.on('data', (data) => {
    lastDataTime = Date.now();
    parseFfprobeOutput(data.toString(), metrics);
  });

  ffprobe.on('close', (code) => {
    if (restartTimer) clearTimeout(restartTimer);
    restart();
  });

  ffprobe.on('error', (err) => {
    console.error(`Monitor error for ${stream.address}:`, err.message);
  });

  const watchdog = setInterval(() => {
    if (Date.now() - lastDataTime > 10000) {
      metrics.isReceiving = false;
      metrics.bitrate = 0;
    }
  }, 5000);

  monitors.set(stream.id, {
    stream,
    ffprobe,
    metrics,
    watchdog
  });
}

function stopMonitor(streamId) {
  const monitor = monitors.get(streamId);
  if (monitor) {
    if (monitor.ffprobe) {
      try {
        monitor.ffprobe.kill('SIGTERM');
      } catch (e) {}
    }
    if (monitor.watchdog) {
      clearInterval(monitor.watchdog);
    }
    monitors.delete(streamId);
    streamMetrics.delete(streamId);
    console.log(`Stopped monitoring stream: ${streamId}`);
  }
}

async function stopAllMonitors() {
  if (broadcastInterval) {
    clearInterval(broadcastInterval);
    broadcastInterval = null;
  }
  for (const streamId of Array.from(monitors.keys())) {
    stopMonitor(streamId);
  }
}

function initMetrics(stream) {
  return {
    streamId: stream.id,
    streamAddress: stream.address,
    streamName: stream.name,
    bitrate: 0,
    packetLossRate: 0,
    continuityErrors: 0,
    uptime: 0,
    startTime: Date.now(),
    ptsHistory: [],
    ptsJitter: 0,
    isReceiving: false,
    expectedBitrate: stream.expectedBitrate || 5000000
  };
}

function parseProbeData(data, metrics) {
  if (data.format && data.format.bit_rate) {
    metrics.bitrate = parseInt(data.format.bit_rate) || 0;
  }
  
  if (data.streams && data.streams.length > 0) {
    metrics.isReceiving = true;
    metrics.uptime = Date.now() - metrics.startTime;
  }
}

function parseFfprobeOutput(output, metrics) {
  const lines = output.split('\n');
  
  for (const line of lines) {
    if (line.includes('bitrate=') || line.includes('bitrate: ')) {
      const bitrateMatch = line.match(/bitrate[=:]\s*(\d+)/i);
      if (bitrateMatch) {
        metrics.bitrate = parseInt(bitrateMatch[1]);
      }
    }

    if (line.includes('Continuity counter error')) {
      metrics.continuityErrors++;
      metrics.packetLossRate = Math.min(1, metrics.continuityErrors / 1000);
    }

    if (line.includes('PTS:')) {
      const ptsMatch = line.match(/PTS[:=]\s*(\d+)/i);
      if (ptsMatch) {
        const pts = parseInt(ptsMatch[1]);
        metrics.ptsHistory.push(pts);
        if (metrics.ptsHistory.length > 20) {
          metrics.ptsHistory.shift();
        }
        calculatePtsJitter(metrics);
      }
    }

    if (line.includes('Input #0') || line.includes('Opening')) {
      metrics.isReceiving = true;
    }
  }

  if (metrics.isReceiving) {
    metrics.uptime = Date.now() - metrics.startTime;
  }
}

function calculatePtsJitter(metrics) {
  if (metrics.ptsHistory.length < 2) {
    metrics.ptsJitter = 0;
    return;
  }

  const intervals = [];
  for (let i = 1; i < metrics.ptsHistory.length; i++) {
    const diff = Math.abs(metrics.ptsHistory[i] - metrics.ptsHistory[i - 1]);
    if (diff > 0 && diff < 1000000) {
      intervals.push(diff);
    }
  }

  if (intervals.length < 2) {
    metrics.ptsJitter = 0;
    return;
  }

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
  metrics.ptsJitter = Math.sqrt(variance);
}

function getStreamMetrics(streamId) {
  const metrics = streamMetrics.get(streamId);
  if (!metrics) return null;
  return {
    streamId: metrics.streamId,
    streamAddress: metrics.streamAddress,
    streamName: metrics.streamName,
    bitrate: metrics.bitrate,
    packetLossRate: metrics.packetLossRate,
    uptime: metrics.uptime,
    ptsJitter: metrics.ptsJitter,
    isReceiving: metrics.isReceiving
  };
}

function getAllStreamMetrics() {
  const result = [];
  for (const streamId of streamMetrics.keys()) {
    const metrics = getStreamMetrics(streamId);
    if (metrics) result.push(metrics);
  }
  return result;
}

function isMonitoring(streamId) {
  return monitors.has(streamId);
}

async function processMetricsAndAlerts() {
  for (const [streamId, monitor] of monitors) {
    const metricData = getStreamMetrics(streamId);
    if (metricData) {
      await db.metrics.add(metricData);
      await alertManager.checkForAlerts(monitor.stream, metricData);
    }
  }
}

module.exports = {
  setSocketIO,
  loadStreamsFromDB,
  startMonitor,
  stopMonitor,
  stopAllMonitors,
  getStreamMetrics,
  getAllStreamMetrics,
  isMonitoring
};
