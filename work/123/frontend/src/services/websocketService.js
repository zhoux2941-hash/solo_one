import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.simulationSubscriptions = new Map();
    this.optimizationSubscriptions = new Map();
    this.realtimeCallbacks = new Set();
    this.trafficLightCallbacks = new Set();
    this.twinCallbacks = new Set();
    this.connectionAttempts = 0;
    this.maxReconnectionAttempts = 10;
  }

  connect() {
    if (this.socket && this.isConnected) {
      console.log('[WebSocket] Already connected');
      return this.socket;
    }

    const wsUrl = window.location.origin;
    
    console.log('[WebSocket] Connecting to:', wsUrl);

    this.socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.connectionAttempts = 0;
      console.log('[WebSocket] Connected successfully');
      
      this.resubscribeAll();
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('[WebSocket] Disconnected:', reason);
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      this.connectionAttempts = attemptNumber;
      console.log(`[WebSocket] Reconnection attempt ${attemptNumber}`);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`[WebSocket] Reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('[WebSocket] Reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('[WebSocket] Reconnection failed');
    });

    this.socket.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
    });

    this.setupSimulationListeners();
    this.setupOptimizationListeners();
    this.setupRealtimeListeners();
    this.setupTrafficLightListeners();
    this.setupTwinListeners();

    return this.socket;
  }

  setupSimulationListeners() {
    if (!this.socket) return;

    this.socket.on('simulation:progress', (data) => {
      console.log('[WebSocket] Simulation progress:', data.simulationId, data.phase, data.progressPercentage + '%');
      
      const callback = this.simulationSubscriptions.get(data.simulationId);
      if (callback) {
        callback(data);
      }
    });

    this.socket.on('simulation:completed', (data) => {
      console.log('[WebSocket] Simulation completed:', data.simulationId);
      
      const callback = this.simulationSubscriptions.get(data.simulationId);
      if (callback) {
        callback({ ...data, completed: true });
      }
    });

    this.socket.on('simulation:failed', (data) => {
      console.error('[WebSocket] Simulation failed:', data.simulationId, data.error);
      
      const callback = this.simulationSubscriptions.get(data.simulationId);
      if (callback) {
        callback({ ...data, failed: true });
      }
    });
  }

  setupOptimizationListeners() {
    if (!this.socket) return;

    this.socket.on('optimization:progress', (data) => {
      console.log('[WebSocket] Optimization progress:', data.optimizationId, `Generation ${data.generation}/${data.totalGenerations}`);
      
      const callback = this.optimizationSubscriptions.get(data.optimizationId);
      if (callback) {
        callback(data);
      }
    });

    this.socket.on('optimization:completed', (data) => {
      console.log('[WebSocket] Optimization completed:', data.optimizationId);
      
      const callback = this.optimizationSubscriptions.get(data.optimizationId);
      if (callback) {
        callback({ ...data, completed: true });
      }
    });

    this.socket.on('optimization:failed', (data) => {
      console.error('[WebSocket] Optimization failed:', data.optimizationId, data.error);
      
      const callback = this.optimizationSubscriptions.get(data.optimizationId);
      if (callback) {
        callback({ ...data, failed: true });
      }
    });
  }

  setupRealtimeListeners() {
    if (!this.socket) return;

    this.socket.on('realtime:sensor', (data) => {
      console.log('[WebSocket] Realtime sensor data:', data.simulationId);
      
      for (const callback of this.realtimeCallbacks) {
        callback(data);
      }
    });

    this.socket.on('realtime:trafficlight', (data) => {
      console.log('[WebSocket] Realtime traffic light data:', data.simulationId);
      
      for (const callback of this.trafficLightCallbacks) {
        callback(data);
      }
    });

    this.socket.on('realtime:state', (data) => {
      console.log('[WebSocket] Realtime state:', data.simulationId);
      
      for (const callback of this.realtimeCallbacks) {
        callback({ type: 'state', ...data });
      }
    });
  }

  setupTrafficLightListeners() {
    if (!this.socket) return;

    this.socket.on('trafficlight:state', (data) => {
      console.log('[WebSocket] Traffic light state:', data.data?.intersectionId);
      
      for (const callback of this.trafficLightCallbacks) {
        callback(data);
      }
    });

    this.socket.on('trafficlight:phase_change', (data) => {
      console.log('[WebSocket] Traffic light phase change:', data.fromPhase, '->', data.toPhase);
      
      for (const callback of this.trafficLightCallbacks) {
        callback({ type: 'phase_change', ...data });
      }
    });
  }

  setupTwinListeners() {
    if (!this.socket) return;

    this.socket.on('twin:state', (data) => {
      console.log('[WebSocket] Twin state update:', data.twinId);
      
      for (const callback of this.twinCallbacks) {
        callback(data);
      }
    });

    this.socket.on('twin:started', (data) => {
      console.log('[WebSocket] Twin started:', data.twinId);
      
      for (const callback of this.twinCallbacks) {
        callback({ type: 'started', ...data });
      }
    });

    this.socket.on('twin:stopped', (data) => {
      console.log('[WebSocket] Twin stopped:', data.twinId);
      
      for (const callback of this.twinCallbacks) {
        callback({ type: 'stopped', ...data });
      }
    });
  }

  subscribeToSimulation(simulationId, callback) {
    if (!this.socket) {
      this.connect();
    }

    this.simulationSubscriptions.set(simulationId, callback);
    
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe', simulationId);
    }
    
    console.log(`[WebSocket] Subscribed to simulation: ${simulationId}`);
  }

  unsubscribeFromSimulation(simulationId) {
    this.simulationSubscriptions.delete(simulationId);
    
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe', simulationId);
    }
    
    console.log(`[WebSocket] Unsubscribed from simulation: ${simulationId}`);
  }

  subscribeToOptimization(optimizationId, callback) {
    if (!this.socket) {
      this.connect();
    }

    this.optimizationSubscriptions.set(optimizationId, callback);
    
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe', optimizationId);
    }
    
    console.log(`[WebSocket] Subscribed to optimization: ${optimizationId}`);
  }

  unsubscribeFromOptimization(optimizationId) {
    this.optimizationSubscriptions.delete(optimizationId);
    
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe', optimizationId);
    }
    
    console.log(`[WebSocket] Unsubscribed from optimization: ${optimizationId}`);
  }

  subscribeToRealtime(callback) {
    if (!this.socket) {
      this.connect();
    }

    this.realtimeCallbacks.add(callback);
    console.log('[WebSocket] Subscribed to realtime data');
  }

  unsubscribeFromRealtime(callback) {
    this.realtimeCallbacks.delete(callback);
    console.log('[WebSocket] Unsubscribed from realtime data');
  }

  subscribeToTrafficLight(callback) {
    if (!this.socket) {
      this.connect();
    }

    this.trafficLightCallbacks.add(callback);
    console.log('[WebSocket] Subscribed to traffic light updates');
  }

  unsubscribeFromTrafficLight(callback) {
    this.trafficLightCallbacks.delete(callback);
    console.log('[WebSocket] Unsubscribed from traffic light updates');
  }

  subscribeToTwin(callback) {
    if (!this.socket) {
      this.connect();
    }

    this.twinCallbacks.add(callback);
    console.log('[WebSocket] Subscribed to twin updates');
  }

  unsubscribeFromTwin(callback) {
    this.twinCallbacks.delete(callback);
    console.log('[WebSocket] Unsubscribed from twin updates');
  }

  resubscribeAll() {
    console.log('[WebSocket] Resubscribing to all tasks...');
    
    for (const [simulationId, callback] of this.simulationSubscriptions) {
      this.socket.emit('subscribe', simulationId);
    }
    
    for (const [optimizationId, callback] of this.optimizationSubscriptions) {
      this.socket.emit('subscribe', optimizationId);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('[WebSocket] Disconnected manually');
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }
}

const websocketService = new WebSocketService();

export default websocketService;

export const SimulationPhase = {
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

export const PhaseDescriptions = {
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

export const SignalPhaseState = {
  GREEN: 'green',
  YELLOW: 'yellow',
  RED: 'red'
};

export const ControlStrategy = {
  FIXED_TIME: 'fixed_time',
  ACTUATED: 'actuated',
  ADAPTIVE: 'adaptive',
  MAX_PRESSURE: 'max_pressure',
  Q_LEARNING: 'q_learning'
};

export const StrategyDescriptions = {
  [ControlStrategy.FIXED_TIME]: '固定配时',
  [ControlStrategy.ACTUATED]: '感应控制',
  [ControlStrategy.ADAPTIVE]: '自适应控制',
  [ControlStrategy.MAX_PRESSURE]: '最大压力控制',
  [ControlStrategy.Q_LEARNING]: '强化学习控制'
};

export const TwinMode = {
  REPLAY: 'replay',
  REALTIME: 'realtime',
  PREDICTIVE: 'predictive',
  HYBRID: 'hybrid'
};

export const TwinModeDescriptions = {
  [TwinMode.REPLAY]: '回放模式',
  [TwinMode.REALTIME]: '实时模式',
  [TwinMode.PREDICTIVE]: '预测模式',
  [TwinMode.HYBRID]: '混合模式'
};
