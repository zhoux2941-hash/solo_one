const config = require('../config');
const { writeJsonFile, getSimulationPath } = require('../utils/fileUtils');

const runOptimization = async (optimizationData) => {
  const {
    intersectionId,
    network,
    trafficLights,
    trafficFlows,
    optimizationConfig
  } = optimizationData;

  const gaConfig = {
    populationSize: optimizationConfig?.populationSize || config.geneticAlgorithm.populationSize,
    generations: optimizationConfig?.generations || config.geneticAlgorithm.generations,
    mutationRate: optimizationConfig?.mutationRate || config.geneticAlgorithm.mutationRate,
    crossoverRate: optimizationConfig?.crossoverRate || config.geneticAlgorithm.crossoverRate,
    minGreenTime: optimizationConfig?.minGreenTime || 5,
    maxGreenTime: optimizationConfig?.maxGreenTime || 60
  };

  const originalTrafficLight = trafficLights.find(tl => tl.intersectionId === intersectionId);
  if (!originalTrafficLight) {
    throw new Error(`Traffic light not found for intersection: ${intersectionId}`);
  }

  const optimizationContext = {
    intersectionId,
    network,
    trafficLights,
    trafficFlows,
    originalPhases: originalTrafficLight.phases || generateDefaultPhases()
  };

  const fitnessHistory = [];
  let bestIndividual = null;
  let bestFitness = Infinity;

  let population = initializePopulation(gaConfig.populationSize, optimizationContext, gaConfig);

  for (let generation = 0; generation < gaConfig.generations; generation++) {
    const fitnesses = await evaluatePopulation(population, optimizationContext, gaConfig);

    for (let i = 0; i < population.length; i++) {
      if (fitnesses[i] < bestFitness) {
        bestFitness = fitnesses[i];
        bestIndividual = { ...population[i] };
      }
    }

    fitnessHistory.push({
      generation,
      averageFitness: fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length,
      bestFitness,
      bestGreenTimes: bestIndividual?.greenTimes
    });

    if (generation < gaConfig.generations - 1) {
      const selectedParents = selection(population, fitnesses, gaConfig);
      population = reproduction(selectedParents, gaConfig);
    }
  }

  const originalFitness = await evaluateFitness(
    { greenTimes: optimizationContext.originalPhases.filter(p => !p.state.includes('y')).map(p => p.duration) },
    optimizationContext,
    gaConfig
  );

  const optimizedPhases = generateOptimizedPhases(
    optimizationContext.originalPhases,
    bestIndividual.greenTimes
  );

  const improvement = {
    originalFitness,
    optimizedFitness: bestFitness,
    improvementPercentage: ((originalFitness - bestFitness) / originalFitness * 100).toFixed(2),
    estimatedDelayReduction: estimateDelayReduction(originalFitness, bestFitness)
  };

  const recommendations = generateRecommendations(
    optimizationContext.originalPhases,
    optimizedPhases,
    improvement
  );

  return {
    originalConfig: {
      intersectionId,
      phases: optimizationContext.originalPhases
    },
    optimizedConfig: {
      intersectionId,
      phases: optimizedPhases
    },
    improvement,
    fitnessHistory,
    recommendations,
    optimizationConfig: gaConfig
  };
};

const initializePopulation = (populationSize, context, gaConfig) => {
  const population = [];
  const greenPhaseCount = context.originalPhases.filter(p => !p.state.includes('y')).length;

  for (let i = 0; i < populationSize; i++) {
    const greenTimes = [];
    
    if (i === 0) {
      const originalGreenPhases = context.originalPhases.filter(p => !p.state.includes('y'));
      for (const phase of originalGreenPhases) {
        greenTimes.push(phase.duration);
      }
    } else {
      for (let j = 0; j < greenPhaseCount; j++) {
        const greenTime = Math.floor(
          Math.random() * (gaConfig.maxGreenTime - gaConfig.minGreenTime + 1)
        ) + gaConfig.minGreenTime;
        greenTimes.push(greenTime);
      }
    }

    population.push({
      greenTimes,
      id: `individual_${i}`
    });
  }

  return population;
};

const evaluatePopulation = async (population, context, gaConfig) => {
  const fitnesses = [];

  for (const individual of population) {
    const fitness = await evaluateFitness(individual, context, gaConfig);
    fitnesses.push(fitness);
  }

  return fitnesses;
};

const evaluateFitness = async (individual, context, gaConfig) => {
  const { network, trafficFlows, intersectionId } = context;
  const { greenTimes } = individual;

  const intersection = network.nodes?.find(n => n.id === intersectionId);
  if (!intersection) {
    return Infinity;
  }

  const incomingEdges = network.edges?.filter(e => e.to === intersectionId) || [];
  const outgoingEdges = network.edges?.filter(e => e.from === intersectionId) || [];

  if (incomingEdges.length === 0) {
    return 0;
  }

  const estimatedFlow = trafficFlows?.length > 0 
    ? trafficFlows.reduce((sum, f) => sum + (f.vehsPerHour || 600), 0) / trafficFlows.length
    : 600;

  const greenPhaseCount = greenTimes.length;
  const totalGreenTime = greenTimes.reduce((a, b) => a + b, 0);
  const yellowTime = 3 * greenPhaseCount;
  const cycleLength = totalGreenTime + yellowTime;

  let totalDelay = 0;
  let queueLength = 0;

  for (let i = 0; i < incomingEdges.length; i++) {
    const greenTimeForEdge = greenTimes[i % greenPhaseCount] || 15;
    const greenRatio = greenTimeForEdge / cycleLength;
    
    const saturationFlow = 1800;
    const arrivalFlow = estimatedFlow / incomingEdges.length;
    const capacity = saturationFlow * greenRatio;
    
    if (arrivalFlow > capacity * 0.95) {
      const rho = arrivalFlow / capacity;
      const avgDelay = (cycleLength * Math.pow(1 - greenRatio, 2)) / (2 * (1 - rho * greenRatio)) +
                        (Math.pow(rho, 2)) / (2 * arrivalFlow * (1 - rho));
      totalDelay += avgDelay;
      queueLength += arrivalFlow * avgDelay / 3600;
    } else {
      const rho = arrivalFlow / capacity;
      const avgDelay = (cycleLength * Math.pow(1 - greenRatio, 2)) / (2 * (1 - rho * greenRatio));
      totalDelay += avgDelay;
    }
  }

  const minCycle = 1.5 * totalGreenTime + 5;
  const cyclePenalty = cycleLength > minCycle ? (cycleLength - minCycle) * 0.1 : 0;

  const fairnessPenalty = calculateFairnessPenalty(greenTimes);

  return totalDelay + cyclePenalty + fairnessPenalty * 10;
};

const calculateFairnessPenalty = (greenTimes) => {
  if (greenTimes.length <= 1) return 0;
  
  const mean = greenTimes.reduce((a, b) => a + b, 0) / greenTimes.length;
  const variance = greenTimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / greenTimes.length;
  const stdDev = Math.sqrt(variance);
  
  return stdDev / mean;
};

const selection = (population, fitnesses, gaConfig) => {
  const selectedParents = [];
  const tournamentSize = 3;

  for (let i = 0; i < population.length; i++) {
    const tournamentIndices = [];
    for (let j = 0; j < tournamentSize; j++) {
      tournamentIndices.push(Math.floor(Math.random() * population.length));
    }

    let bestIndex = tournamentIndices[0];
    for (const idx of tournamentIndices) {
      if (fitnesses[idx] < fitnesses[bestIndex]) {
        bestIndex = idx;
      }
    }

    selectedParents.push({ ...population[bestIndex] });
  }

  return selectedParents;
};

const reproduction = (parents, gaConfig) => {
  const newPopulation = [];

  for (let i = 0; i < parents.length; i += 2) {
    if (i + 1 >= parents.length) {
      newPopulation.push({ ...parents[i] });
      break;
    }

    const parent1 = parents[i];
    const parent2 = parents[i + 1];

    let child1, child2;

    if (Math.random() < gaConfig.crossoverRate) {
      const crossoverPoint = Math.floor(Math.random() * (parent1.greenTimes.length - 1)) + 1;
      
      child1 = {
        greenTimes: [
          ...parent1.greenTimes.slice(0, crossoverPoint),
          ...parent2.greenTimes.slice(crossoverPoint)
        ]
      };
      child2 = {
        greenTimes: [
          ...parent2.greenTimes.slice(0, crossoverPoint),
          ...parent1.greenTimes.slice(crossoverPoint)
        ]
      };
    } else {
      child1 = { ...parent1 };
      child2 = { ...parent2 };
    }

    if (Math.random() < gaConfig.mutationRate) {
      mutate(child1, gaConfig);
    }
    if (Math.random() < gaConfig.mutationRate) {
      mutate(child2, gaConfig);
    }

    newPopulation.push(child1, child2);
  }

  return newPopulation;
};

const mutate = (individual, gaConfig) => {
  const geneIndex = Math.floor(Math.random() * individual.greenTimes.length);
  const mutationType = Math.random();

  if (mutationType < 0.5) {
    const delta = Math.floor(Math.random() * 5) - 2;
    let newTime = individual.greenTimes[geneIndex] + delta;
    newTime = Math.max(gaConfig.minGreenTime, Math.min(gaConfig.maxGreenTime, newTime));
    individual.greenTimes[geneIndex] = newTime;
  } else {
    individual.greenTimes[geneIndex] = Math.floor(
      Math.random() * (gaConfig.maxGreenTime - gaConfig.minGreenTime + 1)
    ) + gaConfig.minGreenTime;
  }
};

const generateOptimizedPhases = (originalPhases, greenTimes) => {
  const optimizedPhases = [];
  let greenIndex = 0;

  for (const phase of originalPhases) {
    if (phase.state.includes('y')) {
      optimizedPhases.push({ ...phase });
    } else {
      if (greenIndex < greenTimes.length) {
        optimizedPhases.push({
          ...phase,
          duration: greenTimes[greenIndex]
        });
        greenIndex++;
      } else {
        optimizedPhases.push({ ...phase });
      }
    }
  }

  return optimizedPhases;
};

const estimateDelayReduction = (originalFitness, optimizedFitness) => {
  const reduction = originalFitness - optimizedFitness;
  return {
    secondsPerVehicle: Math.max(0, reduction),
    totalSecondsPerHour: Math.max(0, reduction * 600),
    totalMinutesPerHour: Math.max(0, reduction * 600 / 60)
  };
};

const generateRecommendations = (originalPhases, optimizedPhases, improvement) => {
  const recommendations = [];

  const originalGreenPhases = originalPhases.filter(p => !p.state.includes('y'));
  const optimizedGreenPhases = optimizedPhases.filter(p => !p.state.includes('y'));

  for (let i = 0; i < originalGreenPhases.length; i++) {
    const original = originalGreenPhases[i];
    const optimized = optimizedGreenPhases[i] || original;
    const change = optimized.duration - original.duration;

    if (change > 0) {
      recommendations.push({
        phase: i + 1,
        action: 'increase',
        originalDuration: original.duration,
        newDuration: optimized.duration,
        change: `+${change}`,
        reason: `Increase green time to improve flow for this phase. Current configuration may cause unnecessary waiting.`
      });
    } else if (change < 0) {
      recommendations.push({
        phase: i + 1,
        action: 'decrease',
        originalDuration: original.duration,
        newDuration: optimized.duration,
        change: `${change}`,
        reason: `Decrease green time as this phase has excess capacity. Time can be reallocated to other phases.`
      });
    } else {
      recommendations.push({
        phase: i + 1,
        action: 'maintain',
        originalDuration: original.duration,
        newDuration: optimized.duration,
        change: '0',
        reason: `Current green time is optimal for this phase.`
      });
    }
  }

  recommendations.push({
    type: 'summary',
    message: `Overall optimization: Expected ${improvement.improvementPercentage}% reduction in delay.`,
    details: {
      estimatedDelayPerVehicle: `${improvement.estimatedDelayReduction.secondsPerVehicle.toFixed(2)} seconds`,
      estimatedTotalDelayPerHour: `${improvement.estimatedDelayReduction.totalMinutesPerHour.toFixed(1)} minutes/hour`
    }
  });

  return recommendations;
};

const generateDefaultPhases = () => {
  return [
    { duration: 30, state: 'GrGr' },
    { duration: 3, state: 'yryr' },
    { duration: 30, state: 'rGrG' },
    { duration: 3, state: 'ryry' }
  ];
};

module.exports = {
  runOptimization,
  initializePopulation,
  evaluatePopulation,
  evaluateFitness,
  selection,
  reproduction,
  mutate,
  generateOptimizedPhases
};
