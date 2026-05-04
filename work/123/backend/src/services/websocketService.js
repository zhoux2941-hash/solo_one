const http = require('http');
const { Server } = require('socket.io');
const config = require('../config');

let io = null;
const activeSimulations = new Map();
const activeOptimizations = new Map();
const clientSubscriptions = new Map();

const SimulationPhase = {
  INITIALIZING: 'initializing',
  NETWORK_GENERATION: 'network_generation',
  ROUTE_GENERATION: 'route_generation',
  SIGNAL_CONFIG: 'signal_config',
  SIMULATION_START: 'simulation_start',
  SIMULATION_RUNNING: 'simulation_running',
  OUTPUT_CONVERSION: 'output_conversion',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

const PhaseDescriptions = {
  [SimulationPhase.INITIALIZING]: '初始化仿真环境',
  [SimulationPhase.NETWORK_GENERATION]: '生成道路网络文件',
  [SimulationPhase.ROUTE_GENERATION]: '生成车流量路由文件',
  [SimulationPhase.SIGNAL_CONFIG]: '配置信号灯配时',
  [SimulationPhase.SIMULATION_START]: '启动 SUMO 仿真引擎',
  [SimulationPhase.SIMULATION_RUNNING]: '仿真计算中',
  [SimulationPhase.OUTPUT_CONVERSION]: '转换输出数据',
  [SimulationPhase.COMPLETED]: '仿真完成',
  [SimulationPhase.FAILED]: '仿真失败'
};

const PhaseWeights = {
  [SimulationPhase.INITIALIZING]: 0.02,
  [SimulationPhase.NETWORK_GENERATION]: 0.05,
  [SimulationPhase.ROUTE_GENERATION]: 0.05,
  [SimulationPhase.SIGNAL_CONFIG]: 0.03,
  [SimulationPhase.SIMULATION_START]: 0.05,
  [SimulationPhase.SIMULATION_RUNNING]: 0.75,
  [SimulationPhase.OUTPUT_CONVERSION]: 0.05,
  [SimulationPhase.COMPLETED]: 0.0,
  [SimulationPhase.FAILED]: 0.0
};

const PhaseStartPercentages = {
  [SimulationPhase.INITIALIZING]: 0,
  [SimulationPhase.NETWORK_GENERATION]: 0.02,
  [SimulationPhase.ROUTE_GENERATION]: 0.07,
  [SimulationPhase.SIGNAL_CONFIG]: 0.12,
  [SimulationPhase.SIMULATION_START]: 0.15,
  [SimulationPhase.SIMULATION_RUNNING]: 0.20,
  [SimulationPhase.OUTPUT_CONVERSION]: 0.95,
  [SimulationPhase.COMPLETED]: 1.0,
  [SimulationPhase.FAILED]: 1.0
};

const initializeWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: config.cors.origin,
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['polling', 'websocket']
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    clientSubscriptions.set(socket.id, {
      socket,
      subscriptions: new Set()
    });

    socket.on('subscribe', (taskId) => {
      const clientData = clientSubscriptions.get(socket.id);
      if (clientData) {
        clientData.subscriptions.add(taskId);
        console.log(`Client ${socket.id} subscribed to task: ${taskId}`);
        
        const simulationData = activeSimulations.get(taskId);
        if (simulationData) {
          socket.emit('simulation:progress', simulationData);
        }

        const optimizationData = activeOptimizations.get(taskId);
        if (optimizationData) {
          socket.emit('optimization:progress', optimizationData);
        }
      }
    });

    socket.on('unsubscribe', (taskId) => {
      const clientData = clientSubscriptions.get(socket.id);
      if (clientData) {
        clientData.subscriptions.delete(taskId);
        console.log(`Client ${socket.id} unsubscribed from task: ${taskId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      clientSubscriptions.delete(socket.id);
    });

    socket.emit('connected', { socketId: socket.id });
  });

  console.log('WebSocket server initialized');
  return io;
};

const getWebSocketServer = () => {
  return io;
};

const emitToSubscribers = (taskId, event, data) => {
  if (!io) return;

  for (const [socketId, clientData] of clientSubscriptions) {
    if (clientData.subscriptions.has(taskId)) {
      clientData.socket.emit(event, data);
    }
  }
};

const broadcast = (event, data) => {
  if (!io) return;
  io.emit(event, data);
};

const updateSimulationProgress = (simulationId, phase, progressData = {}) => {
  const phaseStartPercentage = PhaseStartPercentages[phase] || 0;
  const phaseWeight = PhaseWeights[phase] || 0;
  
  let totalProgress = phaseStartPercentage;
  
  if (phase === SimulationPhase.SIMULATION_RUNNING && progressData.currentTime !== undefined && progressData.totalTime) {
    const simulationProgress = progressData.currentTime / progressData.totalTime;
    totalProgress += simulationProgress * phaseWeight;
  } else {
    totalProgress += phaseWeight * (progressData.phaseProgress || 0.5);
  }

  const progress = {
    simulationId,
    phase,
    phaseDescription: PhaseDescriptions[phase] || '处理中',
    progress: Math.min(1.0, totalProgress),
    progressPercentage: Math.round(Math.min(100, totalProgress * 100)),
    currentTime: progressData.currentTime,
    totalTime: progressData.totalTime,
    timestamp: Date.now(),
    metadata: progressData.metadata || {}
  };

  activeSimulations.set(simulationId, progress);
  emitToSubscribers(simulationId, 'simulation:progress', progress);
  console.log(`[Simulation ${simulationId}] ${PhaseDescriptions[phase]} - ${progress.progressPercentage}%`);
};

const completeSimulation = (simulationId, result) => {
  const progress = {
    simulationId,
    phase: SimulationPhase.COMPLETED,
    phaseDescription: PhaseDescriptions[SimulationPhase.COMPLETED],
    progress: 1.0,
    progressPercentage: 100,
    completed: true,
    result,
    timestamp: Date.now()
  };

  activeSimulations.set(simulationId, progress);
  emitToSubscribers(simulationId, 'simulation:completed', progress);
  console.log(`[Simulation ${simulationId}] Completed successfully`);
};

const failSimulation = (simulationId, error) => {
  const progress = {
    simulationId,
    phase: SimulationPhase.FAILED,
    phaseDescription: PhaseDescriptions[SimulationPhase.FAILED],
    progress: 1.0,
    progressPercentage: 100,
    failed: true,
    error: error?.message || error,
    timestamp: Date.now()
  };

  activeSimulations.set(simulationId, progress);
  emitToSubscribers(simulationId, 'simulation:failed', progress);
  console.error(`[Simulation ${simulationId}] Failed:`, error);
};

const getSimulationProgress = (simulationId) => {
  return activeSimulations.get(simulationId);
};

const updateOptimizationProgress = (optimizationId, generation, progressData = {}) => {
  const progress = {
    optimizationId,
    generation,
    totalGenerations: progressData.totalGenerations || 50,
    progress: generation / (progressData.totalGenerations || 50),
    progressPercentage: Math.round((generation / (progressData.totalGenerations || 50)) * 100),
    bestFitness: progressData.bestFitness,
    bestIndividual: progressData.bestIndividual,
    timestamp: Date.now()
  };

  activeOptimizations.set(optimizationId, progress);
  emitToSubscribers(optimizationId, 'optimization:progress', progress);
  console.log(`[Optimization ${optimizationId}] Generation ${generation} - ${progress.progressPercentage}%`);
};

const completeOptimization = (optimizationId, result) => {
  const progress = {
    optimizationId,
    progress: 1.0,
    progressPercentage: 100,
    completed: true,
    result,
    timestamp: Date.now()
  };

  activeOptimizations.set(optimizationId, progress);
  emitToSubscribers(optimizationId, 'optimization:completed', progress);
  console.log(`[Optimization ${optimizationId}] Completed successfully`);
};

const failOptimization = (optimizationId, error) => {
  const progress = {
    optimizationId,
    progress: 1.0,
    progressPercentage: 100,
    failed: true,
    error: error?.message || error,
    timestamp: Date.now()
  };

  activeOptimizations.set(optimizationId, progress);
  emitToSubscribers(optimizationId, 'optimization:failed', progress);
  console.error(`[Optimization ${optimizationId}] Failed:`, error);
};

const getOptimizationProgress = (optimizationId) => {
  return activeOptimizations.get(optimizationId);
};

const cleanupTask = (taskId) => {
  activeSimulations.delete(taskId);
  activeOptimizations.delete(taskId);
};

module.exports = {
  initializeWebSocket,
  getWebSocketServer,
  emitToSubscribers,
  broadcast,
  updateSimulationProgress,
  completeSimulation,
  failSimulation,
  getSimulationProgress,
  updateOptimizationProgress,
  completeOptimization,
  failOptimization,
  getOptimizationProgress,
  cleanupTask,
  SimulationPhase,
  PhaseDescriptions,
  PhaseWeights,
  PhaseStartPercentages
};
