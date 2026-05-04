const { 
  generateSimulationId, 
  getSimulationPath, 
  writeJsonFile, 
  readJsonFile, 
  deleteDirectory,
  listSimulations
} = require('../utils/fileUtils');
const queueService = require('../services/queueService');
const websocketService = require('../services/websocketService');
const { processSimulationJob } = require('../services/simulationWorker');
const config = require('../config');

const createSimulation = async (req, res) => {
  const { 
    network, 
    trafficLights, 
    trafficFlows, 
    simulationConfig 
  } = req.body;

  if (!network || !network.nodes || !network.edges) {
    return res.status(400).json({
      error: 'Invalid network configuration. Nodes and edges are required.'
    });
  }

  const simulationId = generateSimulationId();
  const simulationPath = getSimulationPath(simulationId, 'pending');

  try {
    const simulationData = {
      id: simulationId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      network,
      trafficLights: trafficLights || [],
      trafficFlows: trafficFlows || [],
      simulationConfig: {
        duration: simulationConfig?.duration || config.simulation.defaultDuration,
        timeStep: simulationConfig?.timeStep || config.simulation.defaultTimeStep,
        snapshotInterval: simulationConfig?.snapshotInterval || config.simulation.snapshotInterval,
        ...simulationConfig
      }
    };

    await writeJsonFile(`${simulationPath}/config.json`, simulationData);

    res.status(201).json({
      message: 'Simulation created successfully',
      simulationId,
      status: 'pending'
    });
  } catch (error) {
    await deleteDirectory(simulationPath);
    res.status(500).json({
      error: 'Failed to create simulation',
      message: error.message
    });
  }
};

const listSimulationsHandler = async (req, res) => {
  const { status = 'all' } = req.query;
  
  try {
    let simulations = [];
    
    if (status === 'all') {
      const statuses = ['pending', 'running', 'completed', 'failed'];
      for (const s of statuses) {
        const ids = await listSimulations(s);
        for (const id of ids) {
          try {
            const config = await readJsonFile(`${getSimulationPath(id, s)}/config.json`);
            simulations.push({
              id,
              status: s,
              createdAt: config.createdAt,
              network: {
                nodeCount: config.network.nodes?.length || 0,
                edgeCount: config.network.edges?.length || 0
              }
            });
          } catch (e) {
            // Skip invalid simulation entries
          }
        }
      }
    } else {
      const ids = await listSimulations(status);
      for (const id of ids) {
        try {
          const config = await readJsonFile(`${getSimulationPath(id, status)}/config.json`);
          simulations.push({
            id,
            status,
            createdAt: config.createdAt,
            network: {
              nodeCount: config.network.nodes?.length || 0,
              edgeCount: config.network.edges?.length || 0
            }
          });
        } catch (e) {
          // Skip invalid simulation entries
        }
      }
    }

    simulations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      simulations,
      count: simulations.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to list simulations',
      message: error.message
    });
  }
};

const getSimulation = async (req, res) => {
  const { id } = req.params;

  try {
    const statuses = ['pending', 'running', 'completed', 'failed'];
    let config = null;
    let foundStatus = null;

    for (const status of statuses) {
      try {
        config = await readJsonFile(`${getSimulationPath(id, status)}/config.json`);
        foundStatus = status;
        break;
      } catch (e) {
        continue;
      }
    }

    if (!config) {
      return res.status(404).json({
        error: 'Simulation not found'
      });
    }

    let result = null;
    if (foundStatus === 'completed') {
      try {
        result = await readJsonFile(`${getSimulationPath(id, foundStatus)}/result.json`);
      } catch (e) {
        // Result not available
      }
    }

    const progress = websocketService.getSimulationProgress(id);

    res.json({
      ...config,
      status: foundStatus,
      result,
      progress: progress || null
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get simulation',
      message: error.message
    });
  }
};

const startSimulation = async (req, res) => {
  const { id } = req.params;

  try {
    const pendingPath = getSimulationPath(id, 'pending');
    const config = await readJsonFile(`${pendingPath}/config.json`);

    const redisAvailable = await queueService.checkRedisAvailability();

    if (redisAvailable) {
      const job = await queueService.addSimulationJob({
        simulationId: id,
        configData: config
      });

      websocketService.updateSimulationProgress(
        id,
        websocketService.SimulationPhase.INITIALIZING,
        { phaseProgress: 0.1 }
      );

      res.json({
        message: 'Simulation queued successfully',
        simulationId: id,
        jobId: job.id,
        status: 'queued',
        queueInfo: {
          queuedAt: new Date().toISOString()
        }
      });
    } else {
      console.log('[Controller] Redis not available, running simulation synchronously');
      
      websocketService.updateSimulationProgress(
        id,
        websocketService.SimulationPhase.INITIALIZING,
        { phaseProgress: 0.1 }
      );

      processSimulationJob({
        data: {
          simulationId: id,
          configData: config
        }
      }).then(() => {
        console.log(`[Controller] Simulation ${id} completed`);
      }).catch((error) => {
        console.error(`[Controller] Simulation ${id} failed:`, error);
      });

      res.json({
        message: 'Simulation started (synchronous mode - Redis unavailable)',
        simulationId: id,
        status: 'running',
        note: 'Running without queue management. Install Redis for concurrent execution control.'
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Failed to start simulation',
      message: error.message
    });
  }
};

const getQueueStatus = async (req, res) => {
  try {
    const queueStatus = await queueService.getSimulationQueueStatus();
    const redisAvailable = await queueService.checkRedisAvailability();

    res.json({
      redis: {
        available: redisAvailable
      },
      queue: queueStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get queue status',
      message: error.message
    });
  }
};

const deleteSimulation = async (req, res) => {
  const { id } = req.params;

  try {
    const statuses = ['pending', 'running', 'completed', 'failed'];
    let deleted = false;

    for (const status of statuses) {
      const path = getSimulationPath(id, status);
      try {
        await deleteDirectory(path);
        deleted = true;
      } catch (e) {
        continue;
      }
    }

    websocketService.cleanupTask(id);

    if (!deleted) {
      return res.status(404).json({
        error: 'Simulation not found'
      });
    }

    res.json({
      message: 'Simulation deleted successfully',
      simulationId: id
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete simulation',
      message: error.message
    });
  }
};

const getSimulationStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const webSocketProgress = websocketService.getSimulationProgress(id);
    
    if (webSocketProgress) {
      return res.json({
        simulationId: id,
        status: 'running',
        progress: webSocketProgress,
        updatedAt: new Date().toISOString()
      });
    }

    const statuses = ['pending', 'running', 'completed', 'failed'];
    
    for (const status of statuses) {
      try {
        const config = await readJsonFile(`${getSimulationPath(id, status)}/config.json`);
        
        let progress = null;
        if (status === 'running') {
          try {
            progress = await readJsonFile(`${getSimulationPath(id, status)}/progress.json`);
          } catch (e) {
            progress = { currentTime: 0, totalTime: config.simulationConfig?.duration || 3600 };
          }
        }

        return res.json({
          simulationId: id,
          status,
          progress,
          updatedAt: new Date().toISOString()
        });
      } catch (e) {
        continue;
      }
    }

    res.status(404).json({
      error: 'Simulation not found'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get simulation status',
      message: error.message
    });
  }
};

module.exports = {
  createSimulation,
  listSimulations: listSimulationsHandler,
  getSimulation,
  startSimulation,
  deleteSimulation,
  getSimulationStatus,
  getQueueStatus
};
