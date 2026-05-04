const { generateSimulationId, writeJsonFile, readJsonFile, getSimulationPath } = require('../utils/fileUtils');
const geneticAlgorithm = require('../services/geneticAlgorithm');
const config = require('../config');

const optimizeIntersection = async (req, res) => {
  const {
    intersectionId,
    network,
    trafficLights,
    trafficFlows,
    optimizationConfig
  } = req.body;

  if (!intersectionId || !network || !trafficLights) {
    return res.status(400).json({
      error: 'Missing required parameters: intersectionId, network, trafficLights'
    });
  }

  const optimizationId = generateSimulationId();
  const optimizationPath = getSimulationPath(optimizationId, 'pending');

  try {
    const optimizationData = {
      id: optimizationId,
      type: 'intersection_optimization',
      intersectionId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      network,
      trafficLights,
      trafficFlows: trafficFlows || [],
      optimizationConfig: {
        populationSize: optimizationConfig?.populationSize || config.geneticAlgorithm.populationSize,
        generations: optimizationConfig?.generations || config.geneticAlgorithm.generations,
        mutationRate: optimizationConfig?.mutationRate || config.geneticAlgorithm.mutationRate,
        crossoverRate: optimizationConfig?.crossoverRate || config.geneticAlgorithm.crossoverRate,
        minGreenTime: optimizationConfig?.minGreenTime || 5,
        maxGreenTime: optimizationConfig?.maxGreenTime || 60,
        ...optimizationConfig
      }
    };

    await writeJsonFile(`${optimizationPath}/optimization_config.json`, optimizationData);

    const result = await geneticAlgorithm.runOptimization(optimizationData);

    await writeJsonFile(`${optimizationPath}/optimization_result.json`, {
      ...result,
      optimizationId,
      completedAt: new Date().toISOString()
    });

    res.json({
      message: 'Intersection optimization completed',
      optimizationId,
      result: {
        originalConfig: result.originalConfig,
        optimizedConfig: result.optimizedConfig,
        improvement: result.improvement,
        fitnessHistory: result.fitnessHistory,
        recommendations: result.recommendations
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to optimize intersection',
      message: error.message
    });
  }
};

const startOptimization = async (req, res) => {
  const {
    type,
    network,
    trafficLights,
    trafficFlows,
    optimizationConfig
  } = req.body;

  const optimizationId = generateSimulationId();
  const optimizationPath = getSimulationPath(optimizationId, 'running');

  try {
    const optimizationData = {
      id: optimizationId,
      type: type || 'intersection_optimization',
      status: 'running',
      createdAt: new Date().toISOString(),
      network,
      trafficLights,
      trafficFlows: trafficFlows || [],
      optimizationConfig: {
        populationSize: optimizationConfig?.populationSize || config.geneticAlgorithm.populationSize,
        generations: optimizationConfig?.generations || config.geneticAlgorithm.generations,
        mutationRate: optimizationConfig?.mutationRate || config.geneticAlgorithm.mutationRate,
        crossoverRate: optimizationConfig?.crossoverRate || config.geneticAlgorithm.crossoverRate,
        ...optimizationConfig
      }
    };

    await writeJsonFile(`${optimizationPath}/optimization_config.json`, optimizationData);

    setImmediate(async () => {
      try {
        const result = await geneticAlgorithm.runOptimization(optimizationData);
        await writeJsonFile(`${getSimulationPath(optimizationId, 'completed')}/optimization_result.json`, {
          ...result,
          optimizationId,
          completedAt: new Date().toISOString()
        });
      } catch (error) {
        await writeJsonFile(`${getSimulationPath(optimizationId, 'failed')}/error.json`, {
          error: error.message,
          failedAt: new Date().toISOString()
        });
      }
    });

    res.json({
      message: 'Optimization started',
      optimizationId,
      status: 'running'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to start optimization',
      message: error.message
    });
  }
};

const getOptimizationStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const statuses = ['pending', 'running', 'completed', 'failed'];
    
    for (const status of statuses) {
      try {
        const config = await readJsonFile(`${getSimulationPath(id, status)}/optimization_config.json`);
        
        let progress = null;
        if (status === 'running') {
          try {
            progress = await readJsonFile(`${getSimulationPath(id, status)}/progress.json`);
          } catch (e) {
            progress = {
              currentGeneration: 0,
              totalGenerations: config.optimizationConfig?.generations || 50,
              bestFitness: 0
            };
          }
        }

        return res.json({
          optimizationId: id,
          status,
          type: config.type,
          progress,
          createdAt: config.createdAt
        });
      } catch (e) {
        continue;
      }
    }

    res.status(404).json({
      error: 'Optimization task not found'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get optimization status',
      message: error.message
    });
  }
};

const getOptimizationResult = async (req, res) => {
  const { id } = req.params;

  try {
    let result = null;
    let config = null;

    try {
      result = await readJsonFile(`${getSimulationPath(id, 'completed')}/optimization_result.json`);
      config = await readJsonFile(`${getSimulationPath(id, 'completed')}/optimization_config.json`);
    } catch (e) {
      // Check running status
      try {
        config = await readJsonFile(`${getSimulationPath(id, 'running')}/optimization_config.json`);
        return res.status(202).json({
          message: 'Optimization still in progress',
          optimizationId: id,
          status: 'running'
        });
      } catch (e2) {
        return res.status(404).json({
          error: 'Optimization result not found'
        });
      }
    }

    res.json({
      optimizationId: id,
      type: config?.type,
      originalConfig: result.originalConfig,
      optimizedConfig: result.optimizedConfig,
      improvement: result.improvement,
      fitnessHistory: result.fitnessHistory,
      recommendations: result.recommendations,
      completedAt: result.completedAt
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get optimization result',
      message: error.message
    });
  }
};

module.exports = {
  optimizeIntersection,
  startOptimization,
  getOptimizationStatus,
  getOptimizationResult
};
