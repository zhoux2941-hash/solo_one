import { ContainerShape, DataPoint, SimulationParams, MultiLevelState, CompensationPotState } from '../types';
import { GRAVITY, DISCHARGE_COEFFICIENT, MIN_WATER_HEIGHT, TIME_STEP, COMPENSATION_POT_CONFIG } from './constants';
import { getContainerStrategy } from '../strategies/ContainerStrategy';

export function calculateApertureArea(apertureDiameterMm: number): number {
  const radiusCm = (apertureDiameterMm / 10) / 2;
  return Math.PI * radiusCm * radiusCm;
}

export function calculateContainerCrossSectionArea(
  shape: ContainerShape,
  containerSize: number,
  waterHeight: number,
  initialWaterHeight: number
): number {
  const strategy = getContainerStrategy(shape);
  return strategy.getCrossSectionArea(containerSize, waterHeight, initialWaterHeight);
}

export function calculateInstantaneousVelocity(waterHeight: number): number {
  if (waterHeight <= 0) return 0;
  const heightInMeters = waterHeight / 100;
  return Math.sqrt(2 * GRAVITY * heightInMeters);
}

export function calculateInstantaneousFlowRate(
  waterHeight: number,
  apertureArea: number
): number {
  const velocity = calculateInstantaneousVelocity(waterHeight);
  const velocityCmPerS = velocity * 100;
  return DISCHARGE_COEFFICIENT * velocityCmPerS * apertureArea;
}

export function calculateWaterHeightChangeRate(
  waterHeight: number,
  params: SimulationParams
): number {
  if (waterHeight <= MIN_WATER_HEIGHT) return 0;

  const strategy = getContainerStrategy(params.containerShape);
  const apertureArea = calculateApertureArea(params.apertureDiameter);
  return strategy.getWaterHeightChangeRate(
    waterHeight,
    params.containerSize,
    params.initialWaterHeight,
    apertureArea
  );
}

export function rk4Step(
  currentHeight: number,
  params: SimulationParams,
  dt: number
): number {
  const k1 = calculateWaterHeightChangeRate(currentHeight, params);
  const k2 = calculateWaterHeightChangeRate(currentHeight + 0.5 * dt * k1, params);
  const k3 = calculateWaterHeightChangeRate(currentHeight + 0.5 * dt * k2, params);
  const k4 = calculateWaterHeightChangeRate(currentHeight + dt * k3, params);

  const newHeight = currentHeight + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
  return Math.max(0, newHeight);
}

export function generateTheoreticalCurve(params: SimulationParams): {
  data: DataPoint[];
  totalDrainTime: number;
} {
  const data: DataPoint[] = [];
  let currentTime = 0;
  let currentHeight = params.initialWaterHeight;
  const apertureArea = calculateApertureArea(params.apertureDiameter);

  data.push({
    time: 0,
    waterHeight: currentHeight,
    flowRate: calculateInstantaneousFlowRate(currentHeight, apertureArea),
    velocity: calculateInstantaneousVelocity(currentHeight),
  });

  const maxIterations = 100000;
  let iterations = 0;

  while (currentHeight > MIN_WATER_HEIGHT && iterations < maxIterations) {
    currentHeight = rk4Step(currentHeight, params, TIME_STEP);
    currentTime += TIME_STEP;
    iterations++;

    if (iterations % 10 === 0 || currentHeight <= MIN_WATER_HEIGHT) {
      data.push({
        time: currentTime,
        waterHeight: Math.max(0, currentHeight),
        flowRate: calculateInstantaneousFlowRate(Math.max(0, currentHeight), apertureArea),
        velocity: calculateInstantaneousVelocity(Math.max(0, currentHeight)),
      });
    }
  }

  if (currentHeight <= MIN_WATER_HEIGHT && data[data.length - 1].waterHeight > MIN_WATER_HEIGHT) {
    data.push({
      time: currentTime,
      waterHeight: 0,
      flowRate: 0,
      velocity: 0,
    });
  }

  return {
    data,
    totalDrainTime: currentTime,
  };
}

export function findTheoreticalTimeForHeight(
  theoreticalData: DataPoint[],
  targetHeight: number
): number {
  if (theoreticalData.length < 2) return 0;

  for (let i = 1; i < theoreticalData.length; i++) {
    const prev = theoreticalData[i - 1];
    const curr = theoreticalData[i];

    if (
      (prev.waterHeight >= targetHeight && curr.waterHeight <= targetHeight) ||
      (prev.waterHeight <= targetHeight && curr.waterHeight >= targetHeight)
    ) {
      if (prev.waterHeight === curr.waterHeight) return prev.time;

      const ratio = (targetHeight - prev.waterHeight) / (curr.waterHeight - prev.waterHeight);
      return prev.time + ratio * (curr.time - prev.time);
    }
  }

  return theoreticalData[theoreticalData.length - 1].time;
}

export function initializeMultiLevelState(
  potCount: number,
  overflowHeight: number,
  initialWaterHeight: number
): MultiLevelState {
  const pots: CompensationPotState[] = [];
  const potNames = ['日壶', '月壶', '星壶'];

  for (let i = 0; i < potCount; i++) {
    pots.push({
      id: i,
      name: potNames[i] || `补偿壶${i + 1}`,
      waterHeight: i === 0 ? overflowHeight : overflowHeight - 2,
      maxHeight: COMPENSATION_POT_CONFIG.potHeight,
      overflowHeight: overflowHeight - i * 2,
      isOverflowing: false,
      inflowRate: 0,
      outflowRate: 0,
    });
  }

  return {
    isActive: true,
    pots,
    constantPressureHead: pots.length > 0 ? pots[pots.length - 1].waterHeight : 0,
    averageFlowRate: 0,
    flowRateVariation: 0,
  };
}

export function calculatePotFlowRate(
  waterHeight: number,
  apertureDiameter: number
): number {
  if (waterHeight <= 0) return 0;
  const apertureArea = calculateApertureArea(apertureDiameter);
  const velocity = calculateInstantaneousVelocity(waterHeight);
  return DISCHARGE_COEFFICIENT * velocity * 100 * apertureArea;
}

export function updateMultiLevelState(
  multiLevelState: MultiLevelState,
  params: SimulationParams,
  dt: number
): MultiLevelState {
  if (!multiLevelState.isActive) return multiLevelState;

  const pots = [...multiLevelState.pots];
  const potAperture = COMPENSATION_POT_CONFIG.potApertureDiameter;

  for (let i = 0; i < pots.length; i++) {
    const pot = { ...pots[i] };

    if (i === 0) {
      pot.inflowRate = calculatePotFlowRate(pot.maxHeight, potAperture) * 1.2;
    } else {
      pot.inflowRate = pots[i - 1].outflowRate;
    }

    pot.outflowRate = calculatePotFlowRate(pot.waterHeight, potAperture);

    const netFlow = pot.inflowRate - pot.outflowRate;
    const potStrategy = getContainerStrategy('cylinder');
    const potArea = potStrategy.getCrossSectionArea(
      COMPENSATION_POT_CONFIG.potSize,
      pot.waterHeight,
      pot.maxHeight
    );

    pot.waterHeight += (netFlow / potArea) * dt;

    if (pot.waterHeight > pot.overflowHeight) {
      pot.isOverflowing = true;
      pot.waterHeight = pot.overflowHeight;
    } else if (pot.waterHeight < 0.1) {
      pot.waterHeight = 0.1;
      pot.isOverflowing = false;
    } else {
      pot.isOverflowing = false;
    }

    pots[i] = pot;
  }

  const lastPot = pots[pots.length - 1];
  const constantPressureHead = lastPot ? lastPot.waterHeight : 0;

  return {
    ...multiLevelState,
    pots,
    constantPressureHead,
  };
}

export function calculateMultiLevelMainFlowRate(
  multiLevelState: MultiLevelState,
  apertureDiameter: number
): number {
  if (!multiLevelState.isActive || multiLevelState.pots.length === 0) {
    return 0;
  }

  const lastPot = multiLevelState.pots[multiLevelState.pots.length - 1];
  return calculatePotFlowRate(lastPot.waterHeight, apertureDiameter);
}

export function rk4StepWithMultiLevel(
  currentHeight: number,
  params: SimulationParams,
  dt: number,
  multiLevelState: MultiLevelState | null
): { newHeight: number; newMultiLevelState: MultiLevelState | null } {
  if (!multiLevelState || !multiLevelState.isActive) {
    return {
      newHeight: rk4Step(currentHeight, params, dt),
      newMultiLevelState: null,
    };
  }

  const newMultiLevelState = updateMultiLevelState(multiLevelState, params, dt);
  const mainFlowRate = calculateMultiLevelMainFlowRate(newMultiLevelState, params.apertureDiameter);

  const strategy = getContainerStrategy(params.containerShape);
  const containerArea = strategy.getCrossSectionArea(
    params.containerSize,
    currentHeight,
    params.initialWaterHeight
  );

  const dh = -(mainFlowRate / containerArea) * dt;
  const newHeight = Math.max(0, currentHeight + dh);

  return {
    newHeight,
    newMultiLevelState,
  };
}

export function generateTheoreticalCurveWithMultiLevel(params: SimulationParams): {
  data: DataPoint[];
  totalDrainTime: number;
  finalMultiLevelState: MultiLevelState | null;
} {
  if (!params.useMultiLevel) {
    const result = generateTheoreticalCurve(params);
    return {
      ...result,
      finalMultiLevelState: null,
    };
  }

  const data: DataPoint[] = [];
  let currentTime = 0;
  let currentHeight = params.initialWaterHeight;
  let multiLevelState = initializeMultiLevelState(
    params.compensationPotCount,
    params.overflowHeight,
    params.initialWaterHeight
  );

  const flowRates: number[] = [];

  data.push({
    time: 0,
    waterHeight: currentHeight,
    flowRate: calculateMultiLevelMainFlowRate(multiLevelState, params.apertureDiameter),
    velocity: calculateInstantaneousVelocity(
      multiLevelState.pots[multiLevelState.pots.length - 1].waterHeight
    ),
    compensationPotHeights: multiLevelState.pots.map((p) => p.waterHeight),
    constantPressureHead: multiLevelState.constantPressureHead,
  });

  flowRates.push(data[0].flowRate);

  const maxIterations = 200000;
  let iterations = 0;

  while (currentHeight > MIN_WATER_HEIGHT && iterations < maxIterations) {
    const result = rk4StepWithMultiLevel(currentHeight, params, TIME_STEP, multiLevelState);
    currentHeight = result.newHeight;
    multiLevelState = result.newMultiLevelState!;
    currentTime += TIME_STEP;
    iterations++;

    if (iterations % 10 === 0 || currentHeight <= MIN_WATER_HEIGHT) {
      const flowRate = calculateMultiLevelMainFlowRate(multiLevelState, params.apertureDiameter);
      flowRates.push(flowRate);

      data.push({
        time: currentTime,
        waterHeight: Math.max(0, currentHeight),
        flowRate,
        velocity: calculateInstantaneousVelocity(
          multiLevelState.pots[multiLevelState.pots.length - 1].waterHeight
        ),
        compensationPotHeights: multiLevelState.pots.map((p) => p.waterHeight),
        constantPressureHead: multiLevelState.constantPressureHead,
      });
    }
  }

  if (currentHeight <= MIN_WATER_HEIGHT && data[data.length - 1].waterHeight > MIN_WATER_HEIGHT) {
    data.push({
      time: currentTime,
      waterHeight: 0,
      flowRate: 0,
      velocity: 0,
      compensationPotHeights: multiLevelState.pots.map((p) => p.waterHeight),
      constantPressureHead: multiLevelState.constantPressureHead,
    });
  }

  const avgFlowRate = flowRates.reduce((a, b) => a + b, 0) / flowRates.length;
  const variance =
    flowRates.reduce((sum, rate) => sum + Math.pow(rate - avgFlowRate, 2), 0) / flowRates.length;

  multiLevelState.averageFlowRate = avgFlowRate;
  multiLevelState.flowRateVariation = Math.sqrt(variance) / avgFlowRate;

  return {
    data,
    totalDrainTime: currentTime,
    finalMultiLevelState: multiLevelState,
  };
}

export function calculateFlowRateStability(
  singleLevelResult: { data: DataPoint[]; totalDrainTime: number },
  multiLevelResult: { data: DataPoint[]; totalDrainTime: number }
): {
  singleLevelCV: number;
  multiLevelCV: number;
  improvementPercent: number;
  singleLevelStd: number;
  multiLevelStd: number;
  multiLevelMean: number;
} {
  const calcStats = (data: DataPoint[]) => {
    const flowRates = data.map((d) => d.flowRate).filter((r) => r > 0);
    if (flowRates.length === 0) return { mean: 0, std: 0, cv: 0 };
    const mean = flowRates.reduce((a, b) => a + b, 0) / flowRates.length;
    const variance =
      flowRates.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / flowRates.length;
    const std = Math.sqrt(variance);
    return { mean, std, cv: std / mean };
  };

  const singleLevelStats = calcStats(singleLevelResult.data);
  const multiLevelStats = calcStats(multiLevelResult.data);
  const improvementPercent =
    singleLevelStats.cv > 0 ? ((singleLevelStats.cv - multiLevelStats.cv) / singleLevelStats.cv) * 100 : 0;

  return {
    singleLevelCV: singleLevelStats.cv,
    multiLevelCV: multiLevelStats.cv,
    improvementPercent,
    singleLevelStd: singleLevelStats.std,
    multiLevelStd: multiLevelStats.std,
    multiLevelMean: multiLevelStats.mean,
  };
}
