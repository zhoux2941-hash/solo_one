require('dotenv').config();

const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  sumo: {
    home: process.env.SUMO_HOME || 'C:/Program Files (x86)/Eclipse/Sumo',
    binPath: process.env.SUMO_BIN_PATH || 'C:/Program Files (x86)/Eclipse/Sumo/bin/sumo.exe',
    guiBinPath: process.env.SUMO_GUI_BIN_PATH || 'C:/Program Files (x86)/Eclipse/Sumo/bin/sumo-gui.exe'
  },
  paths: {
    dataDir: process.env.DATA_DIR || './data',
    simulationDir: process.env.SIMULATION_DIR || './simulations'
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  },
  simulation: {
    defaultDuration: 3600,
    defaultTimeStep: 1,
    snapshotInterval: 1
  },
  geneticAlgorithm: {
    populationSize: 30,
    generations: 50,
    mutationRate: 0.1,
    crossoverRate: 0.7
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0
  },
  queue: {
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY) || 2,
    maxAttempts: parseInt(process.env.QUEUE_MAX_ATTEMPTS) || 3,
    backoff: parseInt(process.env.QUEUE_BACKOFF) || 5000
  },
  websocket: {
    port: parseInt(process.env.WS_PORT) || 3002
  }
};

module.exports = config;
