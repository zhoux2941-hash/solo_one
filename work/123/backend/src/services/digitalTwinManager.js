const { EventEmitter } = require('events');
const path = require('path');
const fs = require('fs-extra');
const { realtimeDataService } = require('./realtimeDataService');
const { signalControlManager, AdaptiveSignalController, ControlStrategy } = require('./adaptiveSignalControl');
const websocketService = require('./websocketService');
const config = require('../config');

const TwinMode = {
  REPLAY: 'replay',
  REALTIME: 'realtime',
  PREDICTIVE: 'predictive',
  HYBRID: 'hybrid'
};

class DigitalTwinManager extends EventEmitter {
  constructor() {
    super();
    this.twins = new Map();
    this.dataSources = new Map();
    this.forecasters = new Map();
    this.twinIdCounter = 0;
  }

  createTwin(simulationId, twinConfig) {
    const twinId = `twin_${simulationId}_${++this.twinIdCounter}`;
    
    const twin = {
      id: twinId,
      simulationId,
      mode: twinConfig.mode || TwinMode.REALTIME,
      config: twinConfig,
      startTime: null,
      currentTime: 0,
      isRunning: false,
      isPaused: false,
      synchronization: {
        realtimeOffset: 0,
        speedMultiplier: 1,
        lastSyncTime: null
      },
      state: {
        network: twinConfig.network || {},
        trafficLights: new Map(),
        vehicles: [],
        detectors: new Map(),
        forecasts: {}
      },
      statistics: {
        totalVehicles: 0,
        averageDelay: 0,
        averageSpeed: 0,
        totalQueueLength: 0,
        dataPointsReceived: 0,
        dataPointsSent: 0
      },
      metadata: {
        createdAt: Date.now(),
        lastUpdate: Date.now(),
        updateCount: 0
      }
    };

    if (twinConfig.trafficLights) {
      for (const tl of twinConfig.trafficLights) {
        const controller = signalControlManager.createController(tl.intersectionId, {
          ...tl,
          strategy: twinConfig.controlStrategy || ControlStrategy.ADAPTIVE
        });
        
        twin.state.trafficLights.set(tl.intersectionId, controller);
      }
    }

    if (twinConfig.network) {
      const { edges } = twinConfig.network;
      for (const edge of edges || []) {
        twin.state.detectors.set(edge.id, {
          edgeId: edge.id,
          vehicleCount: 0,
          queueLength: 0,
          averageSpeed: 0,
          occupancy: 0,
          history: []
        });
      }
    }

    this.twins.set(twinId, twin);
    realtimeDataService.registerSimulation(simulationId, twinConfig);

    console.log(`[DigitalTwinManager] Created twin: ${twinId} for simulation: ${simulationId}`);
    this.emit('twin:created', { twinId, simulationId, twin });

    return twin;
  }

  getTwin(twinId) {
    return this.twins.get(twinId);
  }

  getTwinBySimulation(simulationId) {
    for (const twin of this.twins.values()) {
      if (twin.simulationId === simulationId) {
        return twin;
      }
    }
    return null;
  }

  startTwin(twinId, options = {}) {
    const twin = this.twins.get(twinId);
    if (!twin) {
      throw new Error(`Twin not found: ${twinId}`);
    }

    twin.startTime = Date.now();
    twin.isRunning = true;
    twin.isPaused = false;
    twin.synchronization.lastSyncTime = Date.now();

    if (options.startDataGenerator) {
      realtimeDataService.startDataGenerator(twin.simulationId, options.generatorOptions);
    }

    for (const controller of twin.state.trafficLights.values()) {
      controller.broadcastState();
    }

    console.log(`[DigitalTwinManager] Started twin: ${twinId}`);
    this.emit('twin:started', { twinId, twin });
    this.broadcastTwinState(twin);

    return twin;
  }

  pauseTwin(twinId) {
    const twin = this.twins.get(twinId);
    if (!twin) {
      throw new Error(`Twin not found: ${twinId}`);
    }

    twin.isPaused = true;
    realtimeDataService.pauseSimulation(twin.simulationId);

    console.log(`[DigitalTwinManager] Paused twin: ${twinId}`);
    this.emit('twin:paused', { twinId, twin });
    this.broadcastTwinState(twin);

    return twin;
  }

  resumeTwin(twinId) {
    const twin = this.twins.get(twinId);
    if (!twin) {
      throw new Error(`Twin not found: ${twinId}`);
    }

    twin.isPaused = false;
    twin.synchronization.lastSyncTime = Date.now();
    realtimeDataService.resumeSimulation(twin.simulationId);

    console.log(`[DigitalTwinManager] Resumed twin: ${twinId}`);
    this.emit('twin:resumed', { twinId, twin });
    this.broadcastTwinState(twin);

    return twin;
  }

  stopTwin(twinId) {
    const twin = this.twins.get(twinId);
    if (!twin) {
      throw new Error(`Twin not found: ${twinId}`);
    }

    twin.isRunning = false;
    realtimeDataService.stopSimulation(twin.simulationId);
    realtimeDataService.stopDataGenerator(twin.simulationId);

    console.log(`[DigitalTwinManager] Stopped twin: ${twinId}`);
    this.emit('twin:stopped', { twinId, twin });
    this.broadcastTwinState(twin);

    return twin;
  }

  destroyTwin(twinId) {
    const twin = this.twins.get(twinId);
    if (!twin) {
      return { success: false, message: 'Twin not found' };
    }

    this.stopTwin(twinId);
    
    for (const [intersectionId, controller] of twin.state.trafficLights) {
      signalControlManager.removeController(intersectionId);
    }

    realtimeDataService.unregisterSimulation(twin.simulationId);
    this.twins.delete(twinId);

    console.log(`[DigitalTwinManager] Destroyed twin: ${twinId}`);
    this.emit('twin:destroyed', { twinId });

    return { success: true, message: 'Twin destroyed' };
  }

  injectSensorData(twinId, sensorData) {
    const twin = this.twins.get(twinId);
    if (!twin) {
      throw new Error(`Twin not found: ${twinId}`);
    }

    const result = realtimeDataService.injectSensorData(twin.simulationId, sensorData);

    if (sensorData.edgeId) {
      const detector = twin.state.detectors.get(sensorData.edgeId);
      if (detector) {
        detector.vehicleCount = sensorData.vehicleCount ?? detector.vehicleCount;
        detector.queueLength = sensorData.queueLength ?? detector.queueLength;
        detector.averageSpeed = sensorData.averageSpeed ?? detector.averageSpeed;
        detector.occupancy = sensorData.occupancy ?? detector.occupancy;
        detector.history.push({
          timestamp: Date.now(),
          vehicleCount: detector.vehicleCount,
          queueLength: detector.queueLength,
          averageSpeed: detector.averageSpeed,
          occupancy: detector.occupancy
        });
        if (detector.history.length > 100) {
          detector.history = detector.history.slice(-100);
        }
      }

      for (const controller of twin.state.trafficLights.values()) {
        controller.updateDetectors({
          [sensorData.edgeId]: {
            queueLength: detector?.queueLength || 0,
            averageSpeed: detector?.averageSpeed || 0,
            occupancy: detector?.occupancy || 0,
            vehicleCount: detector?.vehicleCount || 0
          }
        });
      }
    }

    twin.statistics.dataPointsReceived++;
    twin.metadata.lastUpdate = Date.now();
    twin.metadata.updateCount++;

    this.emit('data:injected', { twinId, sensorData });

    return result;
  }

  injectBatchSensorData(twinId, sensorDataArray) {
    const results = [];
    for (const sensorData of sensorDataArray) {
      results.push(this.injectSensorData(twinId, sensorData));
    }
    return { 
      success: true, 
      count: results.length,
      results 
    };
  }

  step(twinId, deltaTime = 1) {
    const twin = this.twins.get(twinId);
    if (!twin || !twin.isRunning || twin.isPaused) {
      return null;
    }

    const currentTime = twin.currentTime + deltaTime;
    twin.currentTime = currentTime;

    for (const [intersectionId, controller] of twin.state.trafficLights) {
      controller.step(currentTime, deltaTime);
    }

    this.updateStatistics(twin);
    this.predictNearFuture(twin);

    twin.metadata.lastUpdate = Date.now();
    twin.metadata.updateCount++;

    this.emit('twin:step', { twinId, currentTime, deltaTime });
    
    return twin;
  }

  stepAll(deltaTime = 1) {
    const results = [];
    for (const [twinId, twin] of this.twins) {
      if (twin.isRunning && !twin.isPaused) {
        const result = this.step(twinId, deltaTime);
        if (result) {
          results.push({
            twinId,
            currentTime: result.currentTime
          });
        }
      }
    }
    return results;
  }

  updateStatistics(twin) {
    let totalQueueLength = 0;
    let totalSpeed = 0;
    let detectorCount = 0;

    for (const detector of twin.state.detectors.values()) {
      totalQueueLength += detector.queueLength;
      if (detector.averageSpeed > 0) {
        totalSpeed += detector.averageSpeed;
        detectorCount++;
      }
    }

    twin.statistics.totalQueueLength = totalQueueLength;
    twin.statistics.averageSpeed = detectorCount > 0 ? totalSpeed / detectorCount : 0;
  }

  predictNearFuture(twin) {
    if (twin.mode !== TwinMode.PREDICTIVE && twin.mode !== TwinMode.HYBRID) {
      return;
    }

    const predictions = {};
    const predictionHorizon = 30;

    for (const [edgeId, detector] of twin.state.detectors) {
      const history = detector.history.slice(-20);
      if (history.length >= 5) {
        const avgQueueGrowth = this.calculateTrend(history, 'queueLength');
        const avgSpeedTrend = this.calculateTrend(history, 'averageSpeed');

        predictions[edgeId] = {
          queueLengthForecast: this.forecastLinear(history, 'queueLength', predictionHorizon),
          speedForecast: this.forecastLinear(history, 'averageSpeed', predictionHorizon),
          congestionProbability: this.calculateCongestionProbability(detector, avgQueueGrowth),
          trend: {
            queueGrowth: avgQueueGrowth,
            speedChange: avgSpeedTrend
          }
        };
      }
    }

    twin.state.forecasts = predictions;
  }

  calculateTrend(history, field) {
    if (history.length < 2) return 0;
    
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    const n = history.length;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += history[i][field] || 0;
      sumXY += i * (history[i][field] || 0);
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope || 0;
  }

  forecastLinear(history, field, horizon) {
    if (history.length < 2) {
      return new Array(horizon).fill(history[history.length - 1]?.[field] || 0);
    }

    const slope = this.calculateTrend(history, field);
    const lastValue = history[history.length - 1]?.[field] || 0;

    const forecasts = [];
    for (let i = 1; i <= horizon; i++) {
      forecasts.push(lastValue + slope * i);
    }

    return forecasts;
  }

  calculateCongestionProbability(detector, queueGrowth) {
    let probability = 0;

    if (detector.occupancy > 0.7) {
      probability += 0.5;
    } else if (detector.occupancy > 0.4) {
      probability += 0.2;
    }

    if (detector.queueLength > 15) {
      probability += 0.3;
    } else if (detector.queueLength > 8) {
      probability += 0.15;
    }

    if (queueGrowth > 0.5) {
      probability += 0.2;
    } else if (queueGrowth > 0.2) {
      probability += 0.1;
    }

    return Math.min(1, probability);
  }

  getTwinState(twinId) {
    const twin = this.twins.get(twinId);
    if (!twin) {
      throw new Error(`Twin not found: ${twinId}`);
    }

    const trafficLightStates = [];
    for (const [intersectionId, controller] of twin.state.trafficLights) {
      trafficLightStates.push({
        intersectionId,
        ...controller.getState()
      });
    }

    const detectorStates = [];
    for (const [edgeId, detector] of twin.state.detectors) {
      detectorStates.push({
        edgeId,
        vehicleCount: detector.vehicleCount,
        queueLength: detector.queueLength,
        averageSpeed: detector.averageSpeed,
        occupancy: detector.occupancy,
        recentHistory: detector.history.slice(-10)
      });
    }

    return {
      twinId: twin.id,
      simulationId: twin.simulationId,
      mode: twin.mode,
      isRunning: twin.isRunning,
      isPaused: twin.isPaused,
      currentTime: twin.currentTime,
      synchronization: twin.synchronization,
      trafficLights: trafficLightStates,
      detectors: detectorStates,
      forecasts: twin.state.forecasts,
      statistics: twin.statistics,
      metadata: twin.metadata
    };
  }

  broadcastTwinState(twin) {
    try {
      const state = this.getTwinState(twin.id);
      
      const message = {
        type: 'twin:state',
        twinId: twin.id,
        simulationId: twin.simulationId,
        state,
        timestamp: Date.now()
      };

      websocketService.broadcast('twin:state', message);
    } catch (error) {
      console.error(`[DigitalTwinManager] Failed to broadcast twin state:`, error);
    }
  }

  broadcastAllTwinStates() {
    for (const twin of this.twins.values()) {
      if (twin.isRunning) {
        this.broadcastTwinState(twin);
      }
    }
  }

  getAllTwins() {
    return Array.from(this.twins.entries()).map(([id, twin]) => ({
      id,
      simulationId: twin.simulationId,
      mode: twin.mode,
      isRunning: twin.isRunning,
      isPaused: twin.isPaused,
      currentTime: twin.currentTime,
      trafficLightCount: twin.state.trafficLights.size,
      detectorCount: twin.state.detectors.size
    }));
  }

  setTwinMode(twinId, mode) {
    const twin = this.twins.get(twinId);
    if (!twin) {
      throw new Error(`Twin not found: ${twinId}`);
    }

    twin.mode = mode;
    console.log(`[DigitalTwinManager] Twin ${twinId} mode set to: ${mode}`);
    this.emit('twin:mode_change', { twinId, mode });

    return twin;
  }

  setControlStrategy(twinId, intersectionId, strategy) {
    const twin = this.twins.get(twinId);
    if (!twin) {
      throw new Error(`Twin not found: ${twinId}`);
    }

    const controller = twin.state.trafficLights.get(intersectionId);
    if (!controller) {
      throw new Error(`Traffic light controller not found for intersection: ${intersectionId}`);
    }

    controller.setStrategy(strategy);
    return controller.getState();
  }

  exportTwinData(twinId, options = {}) {
    const twin = this.twins.get(twinId);
    if (!twin) {
      throw new Error(`Twin not found: ${twinId}`);
    }

    const exportData = {
      twinId: twin.id,
      simulationId: twin.simulationId,
      mode: twin.mode,
      exportedAt: new Date().toISOString(),
      timeRange: {
        startTime: twin.startTime,
        endTime: Date.now(),
        duration: twin.currentTime
      },
      statistics: twin.statistics,
      detectorHistory: {},
      trafficLightHistory: {}
    };

    if (options.includeDetectorHistory) {
      for (const [edgeId, detector] of twin.state.detectors) {
        exportData.detectorHistory[edgeId] = detector.history;
      }
    }

    if (options.includeForecasts) {
      exportData.forecasts = twin.state.forecasts;
    }

    return exportData;
  }

  async saveTwinData(twinId, filePath) {
    const exportData = this.exportTwinData(twinId, {
      includeDetectorHistory: true,
      includeForecasts: true
    });

    await fs.ensureDir(path.dirname(filePath));
    await fs.writeJson(filePath, exportData, { spaces: 2 });

    console.log(`[DigitalTwinManager] Twin data saved to: ${filePath}`);
    return { success: true, filePath };
  }
}

const digitalTwinManager = new DigitalTwinManager();

module.exports = {
  DigitalTwinManager,
  digitalTwinManager,
  TwinMode
};
