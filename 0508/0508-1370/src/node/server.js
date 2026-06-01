const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const config = require('./config');
const logger = require('./utils/logger');
const zmqClient = require('./services/zmqClient');
const framePipeline = require('./services/framePipeline');
const websocketService = require('./services/websocketService');
const db = require('./services/database');

const signalingRoutes = require('./routes/signaling');
const streamsRoutes = require('./routes/streams');
const recordingsRoutes = require('./routes/recordings');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);

const logsDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(express.static(config.paths.public));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

app.use('/api/signaling', signalingRoutes);
app.use('/api/streams', streamsRoutes);
app.use('/api/recordings', recordingsRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', async (req, res) => {
  try {
    const pythonPing = await zmqClient.ping();
    res.json({
      success: true,
      timestamp: Date.now(),
      services: {
        node: 'running',
        python: pythonPing.success ? 'running' : 'disconnected',
        database: 'connected'
      },
      stats: {
        activeStreams: framePipeline.getActiveStreams().length,
        connectedClients: websocketService.getConnectedClients()
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: error.message,
      timestamp: Date.now()
    });
  }
});

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(config.paths.public, 'index.html'));
  }
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: 'Internal server error' });
});

async function main() {
  try {
    logger.info('Starting WebRTC Super-Resolution Gateway...');
    
    logger.info('Connecting to Python service via ZMQ...');
    await zmqClient.connect();
    logger.info('ZMQ connection established');

    logger.info('Starting frame pipeline...');
    framePipeline.start();
    logger.info('Frame pipeline started');

    logger.info('Attaching WebSocket service...');
    websocketService.attach(server);
    logger.info('WebSocket service attached');

    server.listen(config.node.port, () => {
      logger.info('========================================');
      logger.info('WebRTC Super-Resolution Gateway Started');
      logger.info(`HTTP Server: http://localhost:${config.node.port}`);
      logger.info(`WebSocket: ws://localhost:${config.node.port}`);
      logger.info(`API Base: http://localhost:${config.node.port}/api`);
      logger.info(`Dashboard: http://localhost:${config.node.port}/`);
      logger.info('========================================');
    });

    const shutdown = async (signal) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      
      try {
        framePipeline.stop();
        websocketService.stop();
        await zmqClient.disconnect();
        db.close();
        
        server.close(() => {
          logger.info('Server closed');
          process.exit(0);
        });
        
        setTimeout(() => {
          logger.error('Forced shutdown after timeout');
          process.exit(1);
        }, 5000);
      } catch (error) {
        logger.error('Error during shutdown', { error: error.message });
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { reason: reason?.message });
    });

  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

main();
