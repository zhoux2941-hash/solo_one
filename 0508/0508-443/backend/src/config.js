const path = require('path');

module.exports = {
  port: process.env.PORT || 3000,
  ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
  ffprobePath: process.env.FFPROBE_PATH || 'ffprobe',
  recordingsDir: path.resolve(process.env.RECORDINGS_DIR || './recordings'),
  uploadsDir: path.resolve(process.env.UPLOADS_DIR || './uploads'),
  h2: {
    dbPath: path.resolve(process.env.H2_DB_PATH || './data/iptv_db'),
    user: process.env.H2_USER || 'sa',
    password: process.env.H2_PASSWORD || ''
  },
  monitoring: {
    interval: 5000,
    bitrateSampleWindow: 10,
    maxPtsHistory: 50
  },
  alert: {
    maxPacketLossRate: 0.05,
    minBitrateRatio: 0.5,
    cooldownPeriod: 60000
  },
  recording: {
    defaultSegmentDuration: 15,
    filePattern: '{stream}_{date}_{time}.ts'
  }
};
