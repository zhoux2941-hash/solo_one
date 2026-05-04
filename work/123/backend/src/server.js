const express = require('express');
const http = require('http');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { ensureDirectories } = require('./utils/fileUtils');
const websocketService = require('./services/websocketService');
const queueService = require('./services/queueService');
const { processSimulationJob } = require('./services/simulationWorker');
const { digitalTwinManager } = require('./services/digitalTwinManager');

const app = express();

app.use(cors(config.cors));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/health/queue', async (req, res) => {
  try {
    const queueStatus = await queueService.getSimulationQueueStatus();
    const redisAvailable = await queueService.checkRedisAvailability();
    
    res.json({
      status: redisAvailable ? 'OK' : 'REDIS_UNAVAILABLE',
      redis: {
        available: redisAvailable
      },
      queue: queueStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await ensureDirectories();
    console.log('📁 Directories initialized successfully');
    
    const server = http.createServer(app);
    
    websocketService.initializeWebSocket(server);
    console.log('🔌 WebSocket server initialized');

    const redisAvailable = await queueService.checkRedisAvailability();
    
    if (redisAvailable) {
      console.log('🔴 Redis connection established');
      
      queueService.initializeQueues();
      
      queueService.processSimulationQueue(async (job) => {
        return await processSimulationJob(job);
      });
      
      console.log('📋 Bull queue initialized with concurrency:', config.queue.concurrency);
    } else {
      console.warn('⚠️ Redis not available. Queue system disabled.');
      console.warn('⚠️ Simulations will run synchronously without queue management.');
    }

    let twinStepInterval = null;
    const startTwinStepLoop = () => {
      if (twinStepInterval) {
        clearInterval(twinStepInterval);
      }

      twinStepInterval = setInterval(() => {
        const twins = digitalTwinManager.getAllTwins();
        const runningTwins = twins.filter(t => t.isRunning && !t.isPaused);
        
        if (runningTwins.length > 0) {
          digitalTwinManager.stepAll(1);
          digitalTwinManager.broadcastAllTwinStates();
        }
      }, 1000);

      console.log('🔄 Digital twin step loop started');
    };

    startTwinStepLoop();

    server.listen(config.port, () => {
      console.log(`🚀 Traffic Simulation Server running on port ${config.port}`);
      console.log(`📊 Environment: ${config.nodeEnv}`);
      console.log(`📍 API endpoint: http://localhost:${config.port}/api`);
      console.log(`🔄 Redis: ${redisAvailable ? 'Available' : 'Unavailable'}`);
      console.log(`📊 Queue concurrency: ${config.queue.concurrency}`);
      console.log(`🔄 Digital Twin Manager: Active`);
    });

    const gracefulShutdown = async () => {
      console.log('\n🛑 Shutting down gracefully...');
      
      if (twinStepInterval) {
        clearInterval(twinStepInterval);
        console.log('🔄 Digital twin step loop stopped');
      }
      
      const twins = digitalTwinManager.getAllTwins();
      for (const twin of twins) {
        try {
          digitalTwinManager.stopTwin(twin.id);
        } catch (error) {
          console.error(`Error stopping twin ${twin.id}:`, error);
        }
      }
      console.log('🔄 All digital twins stopped');
      
      try {
        await queueService.closeQueues();
        console.log('📋 Queues closed');
      } catch (error) {
        console.error('Error closing queues:', error);
      }
      
      server.close(() => {
        console.log('🔌 Server closed');
        process.exit(0);
      });
      
      setTimeout(() => {
        console.error('⚠️ Forcefully shutting down');
        process.exit(1);
      }, 5000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
