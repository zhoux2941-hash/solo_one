require('dotenv').config();
const path = require('path');

const config = {
  node: {
    port: parseInt(process.env.NODE_PORT || 3000),
    signalingPort: parseInt(process.env.SIGNALING_PORT || 8080),
  },
  zmq: {
    requestPort: parseInt(process.env.PYTHON_ZMQ_PORT || 5555),
    responsePort: parseInt(process.env.PYTHON_ZMQ_RESPONSE_PORT || 5556),
    host: '127.0.0.1',
  },
  media: {
    maxStreams: parseInt(process.env.MAX_STREAMS || 5),
    targetFps: parseInt(process.env.TARGET_FPS || 15),
    maxDelayMs: parseInt(process.env.MAX_DELAY_MS || 500),
    minCpuFps: 10,
    mediaPorts: process.env.MEDIA_PORTS || '10000-10100',
  },
  superres: {
    defaultScale: parseInt(process.env.DEFAULT_SCALE || 2),
    allowedScales: (process.env.ALLOWED_SCALES || '2,3,4').split(',').map(Number),
  },
  gpu: {
    useGpu: process.env.USE_GPU !== 'false',
    device: parseInt(process.env.GPU_DEVICE || 0),
  },
  metrics: {
    intervalSec: parseInt(process.env.METRICS_INTERVAL_SEC || 30),
  },
  paths: {
    db: path.resolve(process.env.DB_PATH || './data/metrics.db'),
    recordings: path.resolve(process.env.RECORDINGS_PATH || './recordings'),
    data: path.resolve('./data'),
    public: path.resolve('./public'),
  },
  log: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

module.exports = config;
