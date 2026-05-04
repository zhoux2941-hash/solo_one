const Bull = require('bull');
const Redis = require('ioredis');
const config = require('../config');

let simulationQueue = null;
let optimizationQueue = null;
let redisClient = null;

const getRedisConfig = () => {
  const redisConfig = {
    host: config.redis.host,
    port: config.redis.port,
    db: config.redis.db
  };
  
  if (config.redis.password) {
    redisConfig.password = config.redis.password;
  }
  
  return redisConfig;
};

const initializeQueues = () => {
  if (simulationQueue && optimizationQueue) {
    return { simulationQueue, optimizationQueue };
  }

  const redisConfig = getRedisConfig();

  simulationQueue = new Bull('simulation', {
    redis: redisConfig,
    defaultJobOptions: {
      attempts: config.queue.maxAttempts,
      backoff: {
        type: 'exponential',
        delay: config.queue.backoff
      },
      removeOnComplete: 100,
      removeOnFail: 100
    }
  });

  optimizationQueue = new Bull('optimization', {
    redis: redisConfig,
    defaultJobOptions: {
      attempts: config.queue.maxAttempts,
      backoff: {
        type: 'exponential',
        delay: config.queue.backoff
      },
      removeOnComplete: 100,
      removeOnFail: 100
    }
  });

  simulationQueue.on('error', (error) => {
    console.error('Simulation queue error:', error);
  });

  optimizationQueue.on('error', (error) => {
    console.error('Optimization queue error:', error);
  });

  simulationQueue.on('waiting', (jobId) => {
    console.log(`Simulation job ${jobId} is waiting`);
  });

  simulationQueue.on('active', (job) => {
    console.log(`Simulation job ${job.id} is active`);
  });

  simulationQueue.on('completed', (job, result) => {
    console.log(`Simulation job ${job.id} completed`);
  });

  simulationQueue.on('failed', (job, error) => {
    console.error(`Simulation job ${job.id} failed:`, error);
  });

  optimizationQueue.on('waiting', (jobId) => {
    console.log(`Optimization job ${jobId} is waiting`);
  });

  optimizationQueue.on('active', (job) => {
    console.log(`Optimization job ${job.id} is active`);
  });

  optimizationQueue.on('completed', (job, result) => {
    console.log(`Optimization job ${job.id} completed`);
  });

  optimizationQueue.on('failed', (job, error) => {
    console.error(`Optimization job ${job.id} failed:`, error);
  });

  redisClient = new Redis(redisConfig);

  return { simulationQueue, optimizationQueue };
};

const getSimulationQueue = () => {
  if (!simulationQueue) {
    initializeQueues();
  }
  return simulationQueue;
};

const getOptimizationQueue = () => {
  if (!optimizationQueue) {
    initializeQueues();
  }
  return optimizationQueue;
};

const addSimulationJob = async (data) => {
  const queue = getSimulationQueue();
  
  const job = await queue.add(data, {
    priority: data.priority || 10
  });

  console.log(`Added simulation job ${job.id} to queue`);
  return job;
};

const addOptimizationJob = async (data) => {
  const queue = getOptimizationQueue();
  
  const job = await queue.add(data, {
    priority: data.priority || 10
  });

  console.log(`Added optimization job ${job.id} to queue`);
  return job;
};

const getSimulationJob = async (jobId) => {
  const queue = getSimulationQueue();
  const job = await queue.getJob(jobId);
  return job;
};

const getOptimizationJob = async (jobId) => {
  const queue = getOptimizationQueue();
  const job = await queue.getJob(jobId);
  return job;
};

const getSimulationQueueStatus = async () => {
  const queue = getSimulationQueue();
  
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount()
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    maxConcurrency: config.queue.concurrency
  };
};

const processSimulationQueue = (processor) => {
  const queue = getSimulationQueue();
  queue.process(config.queue.concurrency, async (job) => {
    return processor(job);
  });
};

const processOptimizationQueue = (processor) => {
  const queue = getOptimizationQueue();
  queue.process(config.queue.concurrency, async (job) => {
    return processor(job);
  });
};

const checkRedisAvailability = async () => {
  const redisConfig = getRedisConfig();
  const client = new Redis({
    ...redisConfig,
    connectTimeout: 2000
  });

  try {
    await client.ping();
    await client.quit();
    return true;
  } catch (error) {
    await client.quit();
    return false;
  }
};

const closeQueues = async () => {
  if (simulationQueue) {
    await simulationQueue.close();
  }
  if (optimizationQueue) {
    await optimizationQueue.close();
  }
  if (redisClient) {
    await redisClient.quit();
  }
};

module.exports = {
  initializeQueues,
  getSimulationQueue,
  getOptimizationQueue,
  addSimulationJob,
  addOptimizationJob,
  getSimulationJob,
  getOptimizationJob,
  getSimulationQueueStatus,
  processSimulationQueue,
  processOptimizationQueue,
  checkRedisAvailability,
  closeQueues
};
