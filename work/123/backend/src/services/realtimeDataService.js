const { EventEmitter } = require('events');
const path = require('path');
const fs = require('fs-extra');
const config = require('../config');
const websocketService = require('./websocketService');

class RealtimeDataService extends EventEmitter {
  constructor() {
    super();
    this.simulations = new Map();
    this.sensorDataBuffers = new Map();
    this.dataGenerators = new Map();
  }

  registerSimulation(simulationId, config) {
    const simulationData = {
      id: simulationId,
      config,
      startTime: null,
      currentTime: 0,
      isRunning: false,
      isPaused: false,
      sensors: new Map(),
      detectors: new Map(),
      trafficLights: new Map(),
      realtimeData: {
        vehicleCounts: {},
        queueLengths: {},
        speeds: {},
        occupancy: {}
      }
    };

    if (config.network) {
      const { network } = config;
      
      for (const edge of network.edges || []) {
        simulationData.detectors.set(edge.id, {
          edgeId: edge.id,
          vehicleCount: 0,
          queueLength: 0,
          averageSpeed: 0,
          occupancy: 0,
          history: []
        });

        simulationData.realtimeData.vehicleCounts[edge.id] = 0;
        simulationData.realtimeData.queueLengths[edge.id] = 0;
        simulationData.realtimeData.speeds[edge.id] = 0;
        simulationData.realtimeData.occupancy[edge.id] = 0;
      }

      for (const tl of config.trafficLights || []) {
        simulationData.trafficLights.set(tl.intersectionId, {
          intersectionId: tl.intersectionId,
          phases: tl.phases || [],
          currentPhase: 0,
          currentPhaseStartTime: 0,
          phaseElapsedTime: 0,
          isAdaptive: true,
          greenExtensions: 0,
          maxExtensions: 3
        });
      }
    }

    this.simulations.set(simulationId, simulationData);
    this.sensorDataBuffers.set(simulationId, []);
    
    console.log(`[RealtimeDataService] Registered simulation: ${simulationId}`);
    return simulationData;
  }

  unregisterSimulation(simulationId) {
    this.simulations.delete(simulationId);
    this.sensorDataBuffers.delete(simulationId);
    
    if (this.dataGenerators.has(simulationId)) {
      clearInterval(this.dataGenerators.get(simulationId));
      this.dataGenerators.delete(simulationId);
    }

    console.log(`[RealtimeDataService] Unregistered simulation: ${simulationId}`);
  }

  startSimulation(simulationId) {
    const simulation = this.simulations.get(simulationId);
    if (!simulation) {
      throw new Error(`Simulation not found: ${simulationId}`);
    }

    simulation.startTime = Date.now();
    simulation.isRunning = true;
    simulation.currentTime = 0;

    console.log(`[RealtimeDataService] Simulation started: ${simulationId}`);
    this.emit('simulation:started', { simulationId, simulation });
  }

  pauseSimulation(simulationId) {
    const simulation = this.simulations.get(simulationId);
    if (!simulation) {
      throw new Error(`Simulation not found: ${simulationId}`);
    }

    simulation.isPaused = true;
    console.log(`[RealtimeDataService] Simulation paused: ${simulationId}`);
    this.emit('simulation:paused', { simulationId });
  }

  resumeSimulation(simulationId) {
    const simulation = this.simulations.get(simulationId);
    if (!simulation) {
      throw new Error(`Simulation not found: ${simulationId}`);
    }

    simulation.isPaused = false;
    console.log(`[RealtimeDataService] Simulation resumed: ${simulationId}`);
    this.emit('simulation:resumed', { simulationId });
  }

  stopSimulation(simulationId) {
    const simulation = this.simulations.get(simulationId);
    if (!simulation) {
      throw new Error(`Simulation not found: ${simulationId}`);
    }

    simulation.isRunning = false;
    console.log(`[RealtimeDataService] Simulation stopped: ${simulationId}`);
    this.emit('simulation:stopped', { simulationId });
  }

  injectSensorData(simulationId, sensorData) {
    const simulation = this.simulations.get(simulationId);
    if (!simulation) {
      throw new Error(`Simulation not found: ${simulationId}`);
    }

    const {
      detectorId,
      edgeId,
      timestamp,
      vehicleCount,
      queueLength,
      averageSpeed,
      occupancy,
      vehicleTypes
    } = sensorData;

    const buffer = this.sensorDataBuffers.get(simulationId) || [];
    buffer.push({
      detectorId,
      edgeId,
      timestamp: timestamp || Date.now(),
      vehicleCount,
      queueLength,
      averageSpeed,
      occupancy,
      vehicleTypes
    });

    if (edgeId && simulation.detectors.has(edgeId)) {
      const detector = simulation.detectors.get(edgeId);
      detector.vehicleCount = vehicleCount ?? detector.vehicleCount;
      detector.queueLength = queueLength ?? detector.queueLength;
      detector.averageSpeed = averageSpeed ?? detector.averageSpeed;
      detector.occupancy = occupancy ?? detector.occupancy;
      detector.history.push({
        timestamp: timestamp || Date.now(),
        vehicleCount: detector.vehicleCount,
        queueLength: detector.queueLength,
        averageSpeed: detector.averageSpeed,
        occupancy: detector.occupancy
      });

      if (detector.history.length > 100) {
        detector.history = detector.history.slice(-100);
      }

      simulation.realtimeData.vehicleCounts[edgeId] = detector.vehicleCount;
      simulation.realtimeData.queueLengths[edgeId] = detector.queueLength;
      simulation.realtimeData.speeds[edgeId] = detector.averageSpeed;
      simulation.realtimeData.occupancy[edgeId] = detector.occupancy;
    }

    this.emit('sensor:data', { simulationId, sensorData });
    this.broadcastSensorData(simulationId, sensorData);

    return { success: true, message: 'Sensor data injected successfully' };
  }

  injectBatchSensorData(simulationId, sensorDataArray) {
    for (const sensorData of sensorDataArray) {
      this.injectSensorData(simulationId, sensorData);
    }

    return { 
      success: true, 
      message: `Injected ${sensorDataArray.length} sensor data records` 
    };
  }

  getRealtimeData(simulationId) {
    const simulation = this.simulations.get(simulationId);
    if (!simulation) {
      throw new Error(`Simulation not found: ${simulationId}`);
    }

    const detectors = Array.from(simulation.detectors.entries()).map(([edgeId, detector]) => ({
      edgeId,
      vehicleCount: detector.vehicleCount,
      queueLength: detector.queueLength,
      averageSpeed: detector.averageSpeed,
      occupancy: detector.occupancy,
      recentHistory: detector.history.slice(-10)
    }));

    const trafficLights = Array.from(simulation.trafficLights.entries()).map(([intersectionId, tl]) => ({
      intersectionId,
      currentPhase: tl.currentPhase,
      currentPhaseStartTime: tl.currentPhaseStartTime,
      phaseElapsedTime: tl.phaseElapsedTime,
      isAdaptive: tl.isAdaptive,
      greenExtensions: tl.greenExtensions,
      phases: tl.phases
    }));

    return {
      simulationId,
      currentTime: simulation.currentTime,
      isRunning: simulation.isRunning,
      isPaused: simulation.isPaused,
      realtimeData: simulation.realtimeData,
      detectors,
      trafficLights,
      timestamp: Date.now()
    };
  }

  getDetectorData(simulationId, edgeId) {
    const simulation = this.simulations.get(simulationId);
    if (!simulation) {
      throw new Error(`Simulation not found: ${simulationId}`);
    }

    const detector = simulation.detectors.get(edgeId);
    if (!detector) {
      throw new Error(`Detector not found for edge: ${edgeId}`);
    }

    return {
      edgeId,
      vehicleCount: detector.vehicleCount,
      queueLength: detector.queueLength,
      averageSpeed: detector.averageSpeed,
      occupancy: detector.occupancy,
      history: detector.history
    };
  }

  startDataGenerator(simulationId, options = {}) {
    const simulation = this.simulations.get(simulationId);
    if (!simulation) {
      throw new Error(`Simulation not found: ${simulationId}`);
    }

    if (this.dataGenerators.has(simulationId)) {
      clearInterval(this.dataGenerators.get(simulationId));
    }

    const {
      interval = 1000,
      baseFlow = 300,
      congestionLevel = 'normal',
      includeCongestionSpikes = true
    } = options;

    let timeStep = 0;

    const generator = setInterval(() => {
      if (!simulation.isRunning || simulation.isPaused) return;

      timeStep++;

      for (const [edgeId, detector] of simulation.detectors) {
        let flowMultiplier = 1;
        
        if (includeCongestionSpikes) {
          const rushHourFactor = (timeStep % 100 < 30) ? 2.5 : 1;
          const randomFactor = 0.7 + Math.random() * 0.6;
          
          flowMultiplier = rushHourFactor * randomFactor;
        }

        const baseVehicleCount = Math.floor(baseFlow / 3600 * (interval / 1000));
        const vehicleCount = Math.floor(baseVehicleCount * flowMultiplier);

        const isCongested = congestionLevel === 'heavy' || 
          (congestionLevel === 'normal' && Math.random() < 0.2);

        const queueLength = isCongested 
          ? Math.floor(Math.random() * 20) + 5 
          : Math.floor(Math.random() * 5);

        const averageSpeed = isCongested
          ? Math.random() * 10 + 5
          : Math.random() * 20 + 30;

        const occupancy = isCongested
          ? Math.random() * 0.5 + 0.5
          : Math.random() * 0.3;

        this.injectSensorData(simulationId, {
          detectorId: `detector_${edgeId}`,
          edgeId,
          timestamp: Date.now(),
          vehicleCount,
          queueLength,
          averageSpeed,
          occupancy: occupancy * 100
        });
      }

      simulation.currentTime += interval / 1000;

    }, interval);

    this.dataGenerators.set(simulationId, generator);
    console.log(`[RealtimeDataService] Started data generator for simulation: ${simulationId}`);

    return { success: true, message: 'Data generator started', options };
  }

  stopDataGenerator(simulationId) {
    if (this.dataGenerators.has(simulationId)) {
      clearInterval(this.dataGenerators.get(simulationId));
      this.dataGenerators.delete(simulationId);
      console.log(`[RealtimeDataService] Stopped data generator for simulation: ${simulationId}`);
      return { success: true, message: 'Data generator stopped' };
    }

    return { success: false, message: 'Data generator not found' };
  }

  updateSimulationTime(simulationId, time) {
    const simulation = this.simulations.get(simulationId);
    if (!simulation) return;

    simulation.currentTime = time;
  }

  broadcastSensorData(simulationId, sensorData) {
    const message = {
      type: 'realtime:sensor',
      simulationId,
      data: sensorData,
      timestamp: Date.now()
    };

    websocketService.broadcast('realtime:sensor', message);
  }

  broadcastTrafficLightState(simulationId, trafficLightState) {
    const message = {
      type: 'realtime:trafficlight',
      simulationId,
      data: trafficLightState,
      timestamp: Date.now()
    };

    websocketService.broadcast('realtime:trafficlight', message);
  }

  broadcastRealtimeState(simulationId) {
    try {
      const state = this.getRealtimeData(simulationId);
      websocketService.broadcast('realtime:state', {
        simulationId,
        state,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('[RealtimeDataService] Failed to broadcast state:', error);
    }
  }

  getActiveSimulations() {
    return Array.from(this.simulations.entries()).map(([id, sim]) => ({
      id,
      isRunning: sim.isRunning,
      isPaused: sim.isPaused,
      currentTime: sim.currentTime,
      hasDataGenerator: this.dataGenerators.has(id),
      detectorCount: sim.detectors.size,
      trafficLightCount: sim.trafficLights.size
    }));
  }
}

const realtimeDataService = new RealtimeDataService();

module.exports = {
  realtimeDataService,
  RealtimeDataService
};
