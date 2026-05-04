const { EventEmitter } = require('events');
const websocketService = require('./websocketService');
const { realtimeDataService } = require('./realtimeDataService');

const SignalPhaseState = {
  GREEN: 'green',
  YELLOW: 'yellow',
  RED: 'red'
};

const ControlStrategy = {
  FIXED_TIME: 'fixed_time',
  ACTUATED: 'actuated',
  ADAPTIVE: 'adaptive',
  MAX_PRESSURE: 'max_pressure',
  Q_LEARNING: 'q_learning'
};

class AdaptiveSignalController extends EventEmitter {
  constructor(intersectionId, config) {
    super();
    this.intersectionId = intersectionId;
    this.config = config;
    this.strategy = config.strategy || ControlStrategy.ADAPTIVE;
    
    this.phases = config.phases || [];
    this.currentPhaseIndex = 0;
    this.currentPhaseStartTime = 0;
    this.phaseElapsedTime = 0;
    this.previousPhaseIndex = -1;
    
    this.greenExtensions = 0;
    this.maxExtensions = config.maxExtensions || 3;
    this.minGreenTime = config.minGreenTime || 10;
    this.maxGreenTime = config.maxGreenTime || 60;
    this.yellowTime = config.yellowTime || 3;
    this.allRedTime = config.allRedTime || 1;
    
    this.phaseStates = new Map();
    for (let i = 0; i < this.phases.length; i++) {
      this.phaseStates.set(i, SignalPhaseState.RED);
    }
    
    if (this.phases.length > 0) {
      this.phaseStates.set(0, SignalPhaseState.GREEN);
    }
    
    this.approaches = new Map();
    this.loopDetectors = new Map();
    
    this.vehicleQueue = new Map();
    for (const phase of this.phases) {
      this.vehicleQueue.set(phase.id, []);
    }
    
    this.statistics = {
      totalDelays: 0,
      totalStops: 0,
      queueLengthHistory: [],
      throughputHistory: [],
      phaseChanges: 0
    };
    
    this.learningParams = {
      learningRate: 0.1,
      discountFactor: 0.9,
      epsilon: 0.1,
      qTable: new Map()
    };
    
    this.phaseDurations = new Map();
    for (const phase of this.phases) {
      this.phaseDurations.set(phase.id, phase.duration || 30);
    }
    
    console.log(`[AdaptiveSignalController] Created for intersection: ${intersectionId}`);
  }

  addApproach(approachId, config) {
    this.approaches.set(approachId, {
      id: approachId,
      ...config,
      queueLength: 0,
      averageSpeed: 0,
      occupancy: 0,
      vehicleCount: 0,
      arrivalRate: 0,
      dischargeRate: config.dischargeRate || 1800
    });
  }

  addLoopDetector(detectorId, config) {
    this.loopDetectors.set(detectorId, {
      id: detectorId,
      ...config,
      lastVehicleTime: 0,
      detectionCount: 0,
      occupancy: 0
    });
  }

  setStrategy(strategy) {
    this.strategy = strategy;
    console.log(`[AdaptiveSignalController] Strategy set to: ${strategy}`);
    this.emit('strategy:change', { intersectionId: this.intersectionId, strategy });
  }

  updateDetectors(detectorData) {
    for (const [edgeId, data] of Object.entries(detectorData)) {
      if (this.approaches.has(edgeId)) {
        const approach = this.approaches.get(edgeId);
        approach.queueLength = data.queueLength ?? approach.queueLength;
        approach.averageSpeed = data.averageSpeed ?? approach.averageSpeed;
        approach.occupancy = data.occupancy ?? approach.occupancy;
        approach.vehicleCount = data.vehicleCount ?? approach.vehicleCount;
        
        if (data.vehicleCount !== undefined) {
          approach.arrivalRate = this.calculateArrivalRate(approach, data.vehicleCount);
        }
      }
    }
  }

  calculateArrivalRate(approach, currentCount) {
    const timeWindow = 60;
    const currentTime = Date.now() / 1000;
    
    if (!approach.history) {
      approach.history = [];
    }
    
    approach.history.push({
      time: currentTime,
      count: currentCount
    });
    
    approach.history = approach.history.filter(h => currentTime - h.time < timeWindow);
    
    if (approach.history.length < 2) {
      return 0;
    }
    
    const oldest = approach.history[0];
    const rate = (currentCount - oldest.count) / (currentTime - oldest.time) * 3600;
    
    return Math.max(0, rate);
  }

  step(simulationTime, deltaTime) {
    if (this.phaseStates.size === 0) return this.getState();

    this.phaseElapsedTime += deltaTime;

    const currentPhase = this.phases[this.currentPhaseIndex];
    if (!currentPhase) return this.getState();

    const currentState = this.phaseStates.get(this.currentPhaseIndex);

    switch (this.strategy) {
      case ControlStrategy.FIXED_TIME:
        this.handleFixedTimeControl(currentPhase, simulationTime);
        break;
      case ControlStrategy.ACTUATED:
        this.handleActuatedControl(currentPhase, simulationTime);
        break;
      case ControlStrategy.ADAPTIVE:
        this.handleAdaptiveControl(currentPhase, simulationTime);
        break;
      case ControlStrategy.MAX_PRESSURE:
        this.handleMaxPressureControl(currentPhase, simulationTime);
        break;
      case ControlStrategy.Q_LEARNING:
        this.handleQLearningControl(currentPhase, simulationTime);
        break;
      default:
        this.handleAdaptiveControl(currentPhase, simulationTime);
    }

    this.updatePhaseDurations();
    this.collectStatistics(simulationTime);

    return this.getState();
  }

  handleFixedTimeControl(currentPhase, simulationTime) {
    const greenDuration = currentPhase.duration || 30;
    const totalCycleTime = greenDuration + this.yellowTime + this.allRedTime;

    const currentState = this.phaseStates.get(this.currentPhaseIndex);

    if (currentState === SignalPhaseState.GREEN) {
      if (this.phaseElapsedTime >= greenDuration) {
        this.transitionToYellow();
      }
    } else if (currentState === SignalPhaseState.YELLOW) {
      if (this.phaseElapsedTime >= greenDuration + this.yellowTime) {
        this.transitionToAllRed();
      }
    } else if (currentState === SignalPhaseState.RED) {
      const timeInRed = this.phaseElapsedTime - greenDuration - this.yellowTime;
      if (timeInRed >= this.allRedTime) {
        this.transitionToNextPhase();
      }
    }
  }

  handleActuatedControl(currentPhase, simulationTime) {
    const currentState = this.phaseStates.get(this.currentPhaseIndex);
    const hasWaitingVehicles = this.detectWaitingVehicles(currentPhase);

    if (currentState === SignalPhaseState.GREEN) {
      if (this.phaseElapsedTime < this.minGreenTime) {
        return;
      }

      if (hasWaitingVehicles && this.greenExtensions < this.maxExtensions) {
        if (this.phaseElapsedTime >= this.minGreenTime + this.greenExtensions * 5) {
          this.greenExtensions++;
          this.emit('green:extended', {
            intersectionId: this.intersectionId,
            phaseIndex: this.currentPhaseIndex,
            extensions: this.greenExtensions
          });
        }
        return;
      }

      if (this.phaseElapsedTime >= this.maxGreenTime) {
        this.transitionToYellow();
        return;
      }

      if (!hasWaitingVehicles) {
        if (this.phaseElapsedTime >= this.minGreenTime + 3) {
          this.transitionToYellow();
        }
      }
    } else if (currentState === SignalPhaseState.YELLOW) {
      const greenDuration = this.minGreenTime + this.greenExtensions * 5;
      if (this.phaseElapsedTime >= greenDuration + this.yellowTime) {
        this.transitionToAllRed();
      }
    } else if (currentState === SignalPhaseState.RED) {
      const greenDuration = this.minGreenTime + this.greenExtensions * 5;
      const timeInRed = this.phaseElapsedTime - greenDuration - this.yellowTime;
      if (timeInRed >= this.allRedTime) {
        this.transitionToNextPhase();
      }
    }
  }

  handleAdaptiveControl(currentPhase, simulationTime) {
    const currentState = this.phaseStates.get(this.currentPhaseIndex);
    
    const pressures = this.calculatePhasePressures();
    const maxPressurePhase = this.getPhaseWithMaxPressure(pressures);

    if (currentState === SignalPhaseState.GREEN) {
      if (this.phaseElapsedTime < this.minGreenTime) {
        return;
      }

      const currentPressure = pressures.get(this.currentPhaseIndex) || 0;
      const maxPressure = pressures.get(maxPressurePhase) || 0;

      if (maxPressurePhase !== this.currentPhaseIndex && 
          maxPressure > currentPressure * 1.5 &&
          this.phaseElapsedTime >= this.maxGreenTime) {
        this.transitionToYellow();
        return;
      }

      if (this.phaseElapsedTime >= this.maxGreenTime) {
        this.transitionToYellow();
        return;
      }

      const currentPhaseApproaches = currentPhase.approaches || [];
      let hasVehicles = false;
      for (const approachId of currentPhaseApproaches) {
        const approach = this.approaches.get(approachId);
        if (approach && approach.queueLength > 0) {
          hasVehicles = true;
          break;
        }
      }

      if (!hasVehicles && this.phaseElapsedTime >= this.minGreenTime + 5) {
        this.transitionToYellow();
      }
    } else if (currentState === SignalPhaseState.YELLOW) {
      if (this.phaseElapsedTime >= this.phaseDurations.get(currentPhase.id) + this.yellowTime) {
        this.transitionToAllRed();
      }
    } else if (currentState === SignalPhaseState.RED) {
      const currentDuration = this.phaseDurations.get(currentPhase.id) || 30;
      const timeInRed = this.phaseElapsedTime - currentDuration - this.yellowTime;
      if (timeInRed >= this.allRedTime) {
        this.transitionToNextPhase();
      }
    }
  }

  handleMaxPressureControl(currentPhase, simulationTime) {
    const currentState = this.phaseStates.get(this.currentPhaseIndex);
    const pressures = this.calculatePhasePressures();

    if (currentState === SignalPhaseState.GREEN) {
      if (this.phaseElapsedTime < this.minGreenTime) {
        return;
      }

      const currentPressure = pressures.get(this.currentPhaseIndex) || 0;
      const maxPressure = Math.max(...pressures.values());

      if (this.phaseElapsedTime >= this.maxGreenTime || 
          (currentPressure < maxPressure * 0.3 && this.phaseElapsedTime >= this.minGreenTime)) {
        this.transitionToYellow();
      }
    } else if (currentState === SignalPhaseState.YELLOW) {
      if (this.phaseElapsedTime >= this.phaseDurations.get(currentPhase.id) + this.yellowTime) {
        this.transitionToAllRed();
      }
    } else if (currentState === SignalPhaseState.RED) {
      const currentDuration = this.phaseDurations.get(currentPhase.id) || 30;
      const timeInRed = this.phaseElapsedTime - currentDuration - this.yellowTime;
      if (timeInRed >= this.allRedTime) {
        const nextPhase = this.getPhaseWithMaxPressure(pressures);
        this.transitionToSpecificPhase(nextPhase);
      }
    }
  }

  handleQLearningControl(currentPhase, simulationTime) {
    const currentState = this.phaseStates.get(this.currentPhaseIndex);
    const state = this.getStateRepresentation();
    const action = this.selectAction(state);

    if (currentState === SignalPhaseState.GREEN) {
      if (this.phaseElapsedTime < this.minGreenTime) {
        return;
      }

      const reward = this.calculateReward();
      this.updateQValue(state, action, reward);

      if (action === 0 || this.phaseElapsedTime >= this.maxGreenTime) {
        this.transitionToYellow();
      }
    } else if (currentState === SignalPhaseState.YELLOW) {
      if (this.phaseElapsedTime >= this.phaseDurations.get(currentPhase.id) + this.yellowTime) {
        this.transitionToAllRed();
      }
    } else if (currentState === SignalPhaseState.RED) {
      const currentDuration = this.phaseDurations.get(currentPhase.id) || 30;
      const timeInRed = this.phaseElapsedTime - currentDuration - this.yellowTime;
      if (timeInRed >= this.allRedTime) {
        this.transitionToNextPhase();
      }
    }
  }

  calculatePhasePressures() {
    const pressures = new Map();

    for (let i = 0; i < this.phases.length; i++) {
      const phase = this.phases[i];
      let pressure = 0;

      const approaches = phase.approaches || [];
      for (const approachId of approaches) {
        const approach = this.approaches.get(approachId);
        if (approach) {
          const queuePressure = approach.queueLength * 10;
          const arrivalPressure = approach.arrivalRate / 3600 * 5;
          const delayPressure = approach.occupancy * 2;
          
          pressure += queuePressure + arrivalPressure + delayPressure;
        }
      }

      pressures.set(i, pressure);
    }

    return pressures;
  }

  getPhaseWithMaxPressure(pressures) {
    let maxPhase = 0;
    let maxPressure = -Infinity;

    for (const [phaseIndex, pressure] of pressures) {
      if (pressure > maxPressure) {
        maxPressure = pressure;
        maxPhase = phaseIndex;
      }
    }

    return maxPhase;
  }

  detectWaitingVehicles(phase) {
    const approaches = phase.approaches || [];
    
    for (const approachId of approaches) {
      const approach = this.approaches.get(approachId);
      if (approach && approach.queueLength > 0) {
        return true;
      }
    }

    return false;
  }

  transitionToYellow() {
    this.phaseStates.set(this.currentPhaseIndex, SignalPhaseState.YELLOW);
    
    this.emit('phase:yellow', {
      intersectionId: this.intersectionId,
      phaseIndex: this.currentPhaseIndex,
      phase: this.phases[this.currentPhaseIndex]
    });

    this.broadcastState();
  }

  transitionToAllRed() {
    this.phaseStates.set(this.currentPhaseIndex, SignalPhaseState.RED);
    
    this.emit('phase:allred', {
      intersectionId: this.intersectionId,
      phaseIndex: this.currentPhaseIndex
    });

    this.broadcastState();
  }

  transitionToNextPhase() {
    this.previousPhaseIndex = this.currentPhaseIndex;
    this.currentPhaseIndex = (this.currentPhaseIndex + 1) % this.phases.length;
    this.phaseStates.set(this.currentPhaseIndex, SignalPhaseState.GREEN);
    this.phaseElapsedTime = 0;
    this.greenExtensions = 0;
    this.statistics.phaseChanges++;

    this.emit('phase:change', {
      intersectionId: this.intersectionId,
      fromPhase: this.previousPhaseIndex,
      toPhase: this.currentPhaseIndex,
      phase: this.phases[this.currentPhaseIndex]
    });

    this.broadcastState();
  }

  transitionToSpecificPhase(phaseIndex) {
    if (phaseIndex === this.currentPhaseIndex) {
      this.phaseElapsedTime = 0;
      return;
    }

    this.previousPhaseIndex = this.currentPhaseIndex;
    this.currentPhaseIndex = phaseIndex;
    
    for (let i = 0; i < this.phases.length; i++) {
      this.phaseStates.set(i, SignalPhaseState.RED);
    }
    this.phaseStates.set(this.currentPhaseIndex, SignalPhaseState.GREEN);
    
    this.phaseElapsedTime = 0;
    this.greenExtensions = 0;
    this.statistics.phaseChanges++;

    this.emit('phase:change', {
      intersectionId: this.intersectionId,
      fromPhase: this.previousPhaseIndex,
      toPhase: this.currentPhaseIndex,
      phase: this.phases[this.currentPhaseIndex]
    });

    this.broadcastState();
  }

  updatePhaseDurations() {
    for (let i = 0; i < this.phases.length; i++) {
      const phase = this.phases[i];
      const approaches = phase.approaches || [];
      
      let totalQueueLength = 0;
      let totalArrivalRate = 0;
      
      for (const approachId of approaches) {
        const approach = this.approaches.get(approachId);
        if (approach) {
          totalQueueLength += approach.queueLength;
          totalArrivalRate += approach.arrivalRate;
        }
      }

      let baseDuration = phase.duration || 30;
      
      if (totalQueueLength > 10) {
        baseDuration = Math.min(this.maxGreenTime, baseDuration + 5);
      } else if (totalQueueLength < 3) {
        baseDuration = Math.max(this.minGreenTime, baseDuration - 5);
      }

      this.phaseDurations.set(phase.id, baseDuration);
    }
  }

  getStateRepresentation() {
    const features = [];
    
    for (const [phaseIndex, phase] of this.phases.entries()) {
      const approaches = phase.approaches || [];
      let totalQueue = 0;
      let totalArrival = 0;
      
      for (const approachId of approaches) {
        const approach = this.approaches.get(approachId);
        if (approach) {
          totalQueue += approach.queueLength;
          totalArrival += approach.arrivalRate;
        }
      }
      
      features.push(totalQueue);
      features.push(totalArrival);
    }
    
    features.push(this.currentPhaseIndex);
    features.push(this.phaseElapsedTime);
    
    return features.join(',');
  }

  selectAction(state) {
    const qValues = this.learningParams.qTable.get(state) || [0, 0];
    
    if (Math.random() < this.learningParams.epsilon) {
      return Math.random() < 0.5 ? 0 : 1;
    }
    
    return qValues[0] >= qValues[1] ? 0 : 1;
  }

  updateQValue(state, action, reward) {
    const qValues = this.learningParams.qTable.get(state) || [0, 0];
    const oldQ = qValues[action];
    
    qValues[action] = oldQ + this.learningParams.learningRate * (reward - oldQ);
    this.learningParams.qTable.set(state, qValues);
  }

  calculateReward() {
    let totalDelay = 0;
    let totalThroughput = 0;
    
    for (const approach of this.approaches.values()) {
      totalDelay += approach.queueLength * 2 + approach.occupancy;
      totalThroughput += approach.arrivalRate / 3600;
    }
    
    return totalThroughput * 10 - totalDelay;
  }

  collectStatistics(simulationTime) {
    if (!this.statistics.lastCollectionTime) {
      this.statistics.lastCollectionTime = simulationTime;
      return;
    }

    const timeSinceLastCollection = simulationTime - this.statistics.lastCollectionTime;
    
    if (timeSinceLastCollection >= 5) {
      let totalQueue = 0;
      let totalThroughput = 0;
      
      for (const approach of this.approaches.values()) {
        totalQueue += approach.queueLength;
        totalThroughput += approach.arrivalRate / 3600;
      }
      
      this.statistics.queueLengthHistory.push({
        time: simulationTime,
        queueLength: totalQueue
      });
      
      this.statistics.throughputHistory.push({
        time: simulationTime,
        throughput: totalThroughput
      });
      
      if (this.statistics.queueLengthHistory.length > 100) {
        this.statistics.queueLengthHistory = this.statistics.queueLengthHistory.slice(-100);
      }
      if (this.statistics.throughputHistory.length > 100) {
        this.statistics.throughputHistory = this.statistics.throughputHistory.slice(-100);
      }
      
      this.statistics.lastCollectionTime = simulationTime;
    }
  }

  getState() {
    const currentPhase = this.phases[this.currentPhaseIndex];
    const currentState = this.phaseStates.get(this.currentPhaseIndex);
    
    const approachStates = [];
    for (const [approachId, approach] of this.approaches) {
      approachStates.push({
        id: approachId,
        queueLength: approach.queueLength,
        averageSpeed: approach.averageSpeed,
        occupancy: approach.occupancy,
        vehicleCount: approach.vehicleCount,
        arrivalRate: approach.arrivalRate
      });
    }

    return {
      intersectionId: this.intersectionId,
      strategy: this.strategy,
      currentPhaseIndex: this.currentPhaseIndex,
      currentPhase: currentPhase,
      currentState: currentState,
      phaseElapsedTime: this.phaseElapsedTime,
      greenExtensions: this.greenExtensions,
      maxExtensions: this.maxExtensions,
      phaseStates: Object.fromEntries(this.phaseStates),
      approaches: approachStates,
      statistics: {
        totalDelays: this.statistics.totalDelays,
        totalStops: this.statistics.totalStops,
        phaseChanges: this.statistics.phaseChanges,
        recentQueueLengths: this.statistics.queueLengthHistory.slice(-10),
        recentThroughputs: this.statistics.throughputHistory.slice(-10)
      },
      timestamps: {
        currentPhaseStartTime: this.currentPhaseStartTime
      }
    };
  }

  broadcastState() {
    const state = this.getState();
    
    const message = {
      type: 'trafficlight:state',
      data: state,
      timestamp: Date.now()
    };

    websocketService.broadcast('trafficlight:state', message);
    
    this.emit('state:change', state);
  }

  getStatistics() {
    return {
      ...this.statistics,
      intersectionId: this.intersectionId
    };
  }

  reset() {
    this.currentPhaseIndex = 0;
    this.currentPhaseStartTime = 0;
    this.phaseElapsedTime = 0;
    this.previousPhaseIndex = -1;
    this.greenExtensions = 0;
    
    for (let i = 0; i < this.phases.length; i++) {
      this.phaseStates.set(i, SignalPhaseState.RED);
    }
    
    if (this.phases.length > 0) {
      this.phaseStates.set(0, SignalPhaseState.GREEN);
    }
    
    this.statistics = {
      totalDelays: 0,
      totalStops: 0,
      queueLengthHistory: [],
      throughputHistory: [],
      phaseChanges: 0
    };
    
    console.log(`[AdaptiveSignalController] Reset: ${this.intersectionId}`);
  }
}

class SignalControlManager {
  constructor() {
    this.controllers = new Map();
  }

  createController(intersectionId, config) {
    if (this.controllers.has(intersectionId)) {
      return this.controllers.get(intersectionId);
    }

    const controller = new AdaptiveSignalController(intersectionId, config);
    this.controllers.set(intersectionId, controller);
    
    console.log(`[SignalControlManager] Created controller for intersection: ${intersectionId}`);
    return controller;
  }

  getController(intersectionId) {
    return this.controllers.get(intersectionId);
  }

  removeController(intersectionId) {
    this.controllers.delete(intersectionId);
    console.log(`[SignalControlManager] Removed controller for intersection: ${intersectionId}`);
  }

  stepAll(simulationTime, deltaTime) {
    const states = [];
    
    for (const [intersectionId, controller] of this.controllers) {
      const state = controller.step(simulationTime, deltaTime);
      states.push({
        intersectionId,
        ...state
      });
    }
    
    return states;
  }

  updateAllDetectors(detectorData) {
    for (const [intersectionId, controller] of this.controllers) {
      const trafficLights = realtimeDataService.simulations.get(intersectionId);
      if (trafficLights) {
        controller.updateDetectors(detectorData);
      }
    }
  }

  getAllStates() {
    const states = [];
    
    for (const [intersectionId, controller] of this.controllers) {
      states.push({
        intersectionId,
        ...controller.getState()
      });
    }
    
    return states;
  }

  broadcastAllStates() {
    for (const controller of this.controllers.values()) {
      controller.broadcastState();
    }
  }

  resetAll() {
    for (const controller of this.controllers.values()) {
      controller.reset();
    }
    console.log(`[SignalControlManager] All controllers reset`);
  }

  setAllStrategies(strategy) {
    for (const controller of this.controllers.values()) {
      controller.setStrategy(strategy);
    }
    console.log(`[SignalControlManager] All controllers set to strategy: ${strategy}`);
  }

  getStatistics() {
    const stats = [];
    let totalDelays = 0;
    let totalStops = 0;
    let totalPhaseChanges = 0;

    for (const [intersectionId, controller] of this.controllers) {
      const controllerStats = controller.getStatistics();
      stats.push(controllerStats);
      totalDelays += controllerStats.totalDelays;
      totalStops += controllerStats.totalStops;
      totalPhaseChanges += controllerStats.phaseChanges;
    }

    return {
      totalDelays,
      totalStops,
      totalPhaseChanges,
      controllers: stats
    };
  }
}

const signalControlManager = new SignalControlManager();

module.exports = {
  AdaptiveSignalController,
  SignalControlManager,
  signalControlManager,
  SignalPhaseState,
  ControlStrategy
};
