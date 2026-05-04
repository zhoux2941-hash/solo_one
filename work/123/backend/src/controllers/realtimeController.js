const { realtimeDataService } = require('../services/realtimeDataService');
const { digitalTwinManager } = require('../services/digitalTwinManager');
const { signalControlManager } = require('../services/adaptiveSignalControl');

const injectSensorData = async (req, res) => {
  try {
    const { simulationId } = req.params;
    const sensorData = req.body;

    if (!sensorData.edgeId) {
      return res.status(400).json({
        error: 'Edge ID is required'
      });
    }

    const result = realtimeDataService.injectSensorData(simulationId, sensorData);

    res.json({
      success: true,
      message: 'Sensor data injected successfully',
      simulationId,
      sensorData: {
        edgeId: sensorData.edgeId,
        vehicleCount: sensorData.vehicleCount,
        queueLength: sensorData.queueLength,
        averageSpeed: sensorData.averageSpeed,
        occupancy: sensorData.occupancy
      }
    });
  } catch (error) {
    console.error('[RealtimeController] injectSensorData error:', error);
    res.status(500).json({
      error: 'Failed to inject sensor data',
      message: error.message
    });
  }
};

const injectBatchSensorData = async (req, res) => {
  try {
    const { simulationId } = req.params;
    const { data } = req.body;

    if (!Array.isArray(data)) {
      return res.status(400).json({
        error: 'Data must be an array'
      });
    }

    const result = realtimeDataService.injectBatchSensorData(simulationId, data);

    res.json({
      success: true,
      message: `Injected ${data.length} sensor data records`,
      simulationId,
      count: data.length
    });
  } catch (error) {
    console.error('[RealtimeController] injectBatchSensorData error:', error);
    res.status(500).json({
      error: 'Failed to inject batch sensor data',
      message: error.message
    });
  }
};

const getRealtimeState = async (req, res) => {
  try {
    const { simulationId } = req.params;

    const state = realtimeDataService.getRealtimeData(simulationId);

    res.json({
      success: true,
      simulationId,
      state
    });
  } catch (error) {
    console.error('[RealtimeController] getRealtimeState error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Simulation not found or not registered for realtime monitoring',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to get realtime state',
      message: error.message
    });
  }
};

const getDetectorData = async (req, res) => {
  try {
    const { simulationId, edgeId } = req.params;

    const detectorData = realtimeDataService.getDetectorData(simulationId, edgeId);

    res.json({
      success: true,
      simulationId,
      edgeId,
      detectorData
    });
  } catch (error) {
    console.error('[RealtimeController] getDetectorData error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Detector not found',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to get detector data',
      message: error.message
    });
  }
};

const startDataGenerator = async (req, res) => {
  try {
    const { simulationId } = req.params;
    const options = req.body || {};

    const result = realtimeDataService.startDataGenerator(simulationId, options);

    res.json({
      success: true,
      message: 'Data generator started',
      simulationId,
      options
    });
  } catch (error) {
    console.error('[RealtimeController] startDataGenerator error:', error);
    res.status(500).json({
      error: 'Failed to start data generator',
      message: error.message
    });
  }
};

const stopDataGenerator = async (req, res) => {
  try {
    const { simulationId } = req.params;

    const result = realtimeDataService.stopDataGenerator(simulationId);

    res.json({
      ...result,
      simulationId
    });
  } catch (error) {
    console.error('[RealtimeController] stopDataGenerator error:', error);
    res.status(500).json({
      error: 'Failed to stop data generator',
      message: error.message
    });
  }
};

const getActiveSimulations = async (req, res) => {
  try {
    const activeSimulations = realtimeDataService.getActiveSimulations();

    res.json({
      success: true,
      simulations: activeSimulations,
      count: activeSimulations.length
    });
  } catch (error) {
    console.error('[RealtimeController] getActiveSimulations error:', error);
    res.status(500).json({
      error: 'Failed to get active simulations',
      message: error.message
    });
  }
};

const createDigitalTwin = async (req, res) => {
  try {
    const { simulationId, network, trafficLights, mode, controlStrategy } = req.body;

    if (!simulationId) {
      return res.status(400).json({
        error: 'Simulation ID is required'
      });
    }

    const twin = digitalTwinManager.createTwin(simulationId, {
      simulationId,
      network,
      trafficLights,
      mode,
      controlStrategy
    });

    res.status(201).json({
      success: true,
      message: 'Digital twin created successfully',
      twinId: twin.id,
      simulationId: twin.simulationId
    });
  } catch (error) {
    console.error('[RealtimeController] createDigitalTwin error:', error);
    res.status(500).json({
      error: 'Failed to create digital twin',
      message: error.message
    });
  }
};

const startDigitalTwin = async (req, res) => {
  try {
    const { simulationId, mode, controlStrategy, startDataGenerator, generatorOptions } = req.body;

    let twin = digitalTwinManager.getTwinBySimulation(simulationId);

    if (!twin) {
      const { realtimeDataService: rds } = require('../services/realtimeDataService');
      let simConfig = null;
      
      try {
        const state = rds.getRealtimeData(simulationId);
        simConfig = {
          network: { edges: state.detectors?.map(d => ({ id: d.edgeId })) || [] },
          trafficLights: state.trafficLights?.map(tl => ({
            intersectionId: tl.intersectionId,
            phases: tl.phases
          })) || []
        };
      } catch (e) {
        simConfig = { network: {}, trafficLights: [] };
      }

      twin = digitalTwinManager.createTwin(simulationId, {
        simulationId,
        network: simConfig.network,
        trafficLights: simConfig.trafficLights,
        mode,
        controlStrategy
      });
    }

    const result = digitalTwinManager.startTwin(twin.id, {
      startDataGenerator,
      generatorOptions
    });

    res.json({
      success: true,
      message: 'Digital twin started',
      twinId: twin.id,
      simulationId,
      mode: result.mode,
      isRunning: result.isRunning
    });
  } catch (error) {
    console.error('[RealtimeController] startDigitalTwin error:', error);
    res.status(500).json({
      error: 'Failed to start digital twin',
      message: error.message
    });
  }
};

const getTwinState = async (req, res) => {
  try {
    const { twinId } = req.params;

    const state = digitalTwinManager.getTwinState(twinId);

    res.json({
      success: true,
      twinId,
      state
    });
  } catch (error) {
    console.error('[RealtimeController] getTwinState error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Digital twin not found',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to get twin state',
      message: error.message
    });
  }
};

const pauseDigitalTwin = async (req, res) => {
  try {
    const { twinId } = req.params;

    const result = digitalTwinManager.pauseTwin(twinId);

    res.json({
      success: true,
      message: 'Digital twin paused',
      twinId,
      isPaused: result.isPaused
    });
  } catch (error) {
    console.error('[RealtimeController] pauseDigitalTwin error:', error);
    res.status(500).json({
      error: 'Failed to pause digital twin',
      message: error.message
    });
  }
};

const resumeDigitalTwin = async (req, res) => {
  try {
    const { twinId } = req.params;

    const result = digitalTwinManager.resumeTwin(twinId);

    res.json({
      success: true,
      message: 'Digital twin resumed',
      twinId,
      isPaused: result.isPaused
    });
  } catch (error) {
    console.error('[RealtimeController] resumeDigitalTwin error:', error);
    res.status(500).json({
      error: 'Failed to resume digital twin',
      message: error.message
    });
  }
};

const stopDigitalTwin = async (req, res) => {
  try {
    const { twinId } = req.params;

    const result = digitalTwinManager.stopTwin(twinId);

    res.json({
      success: true,
      message: 'Digital twin stopped',
      twinId,
      isRunning: result.isRunning
    });
  } catch (error) {
    console.error('[RealtimeController] stopDigitalTwin error:', error);
    res.status(500).json({
      error: 'Failed to stop digital twin',
      message: error.message
    });
  }
};

const setControlStrategy = async (req, res) => {
  try {
    const { twinId } = req.params;
    const { intersectionId, strategy } = req.body;

    const result = digitalTwinManager.setControlStrategy(twinId, intersectionId, strategy);

    res.json({
      success: true,
      message: `Control strategy set to ${strategy}`,
      twinId,
      intersectionId,
      strategy
    });
  } catch (error) {
    console.error('[RealtimeController] setControlStrategy error:', error);
    res.status(500).json({
      error: 'Failed to set control strategy',
      message: error.message
    });
  }
};

const setTwinMode = async (req, res) => {
  try {
    const { twinId } = req.params;
    const { mode } = req.body;

    const result = digitalTwinManager.setTwinMode(twinId, mode);

    res.json({
      success: true,
      message: `Twin mode set to ${mode}`,
      twinId,
      mode
    });
  } catch (error) {
    console.error('[RealtimeController] setTwinMode error:', error);
    res.status(500).json({
      error: 'Failed to set twin mode',
      message: error.message
    });
  }
};

const getAllTwins = async (req, res) => {
  try {
    const twins = digitalTwinManager.getAllTwins();

    res.json({
      success: true,
      twins,
      count: twins.length
    });
  } catch (error) {
    console.error('[RealtimeController] getAllTwins error:', error);
    res.status(500).json({
      error: 'Failed to get digital twins',
      message: error.message
    });
  }
};

const exportTwinData = async (req, res) => {
  try {
    const { twinId } = req.params;
    const options = req.body || {
      includeDetectorHistory: true,
      includeForecasts: true
    };

    const exportData = digitalTwinManager.exportTwinData(twinId, options);

    res.json({
      success: true,
      twinId,
      exportData
    });
  } catch (error) {
    console.error('[RealtimeController] exportTwinData error:', error);
    res.status(500).json({
      error: 'Failed to export twin data',
      message: error.message
    });
  }
};

const getSignalControlStatistics = async (req, res) => {
  try {
    const statistics = signalControlManager.getStatistics();

    res.json({
      success: true,
      statistics
    });
  } catch (error) {
    console.error('[RealtimeController] getSignalControlStatistics error:', error);
    res.status(500).json({
      error: 'Failed to get signal control statistics',
      message: error.message
    });
  }
};

module.exports = {
  injectSensorData,
  injectBatchSensorData,
  getRealtimeState,
  getDetectorData,
  startDataGenerator,
  stopDataGenerator,
  getActiveSimulations,
  createDigitalTwin,
  startDigitalTwin,
  getTwinState,
  pauseDigitalTwin,
  resumeDigitalTwin,
  stopDigitalTwin,
  setControlStrategy,
  setTwinMode,
  getAllTwins,
  exportTwinData,
  getSignalControlStatistics
};
