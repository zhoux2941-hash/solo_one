import { ContainerShape } from '../types';
import { GRAVITY, DISCHARGE_COEFFICIENT, MIN_WATER_HEIGHT } from '../utils/constants';

export interface ContainerGeometry {
  containerPath: string;
  waterPath: string;
  waterSurfaceRx: number;
  waterSurfaceRy: number;
  apertureY: number;
}

export interface ContainerStrategy {
  readonly shape: ContainerShape;
  readonly label: string;
  readonly icon: string;

  getCrossSectionArea(
    containerSize: number,
    waterHeight: number,
    initialWaterHeight: number
  ): number;

  getWaterHeightChangeRate(
    waterHeight: number,
    containerSize: number,
    initialWaterHeight: number,
    apertureArea: number
  ): number;

  getSvgGeometry(params: {
    centerX: number;
    containerTop: number;
    containerBottom: number;
    maxWidth: number;
    waterLevelY: number;
    containerHeight: number;
  }): ContainerGeometry;

  getVolume(
    containerSize: number,
    waterHeight: number,
    initialWaterHeight: number
  ): number;

  getEffectiveWaterHeight(
    containerSize: number,
    waterHeight: number,
    initialWaterHeight: number
  ): number;
}

export class CylinderStrategy implements ContainerStrategy {
  readonly shape: ContainerShape = 'cylinder';
  readonly label = '圆柱体';
  readonly icon = 'cylinder';

  getCrossSectionArea(
    containerSize: number,
    _waterHeight: number,
    _initialWaterHeight: number
  ): number {
    const radius = containerSize / 2;
    return Math.PI * radius * radius;
  }

  getWaterHeightChangeRate(
    waterHeight: number,
    containerSize: number,
    _initialWaterHeight: number,
    apertureArea: number
  ): number {
    if (waterHeight <= MIN_WATER_HEIGHT) return 0;
    const containerArea = this.getCrossSectionArea(containerSize, waterHeight, _initialWaterHeight);
    const velocity = Math.sqrt(2 * GRAVITY * (waterHeight / 100));
    const flowRate = DISCHARGE_COEFFICIENT * velocity * 100 * apertureArea;
    return -flowRate / containerArea;
  }

  getSvgGeometry(params: {
    centerX: number;
    containerTop: number;
    containerBottom: number;
    maxWidth: number;
    waterLevelY: number;
  }): ContainerGeometry {
    const { centerX, containerTop, containerBottom, maxWidth, waterLevelY } = params;
    const containerHalfWidth = maxWidth / 2;
    const leftX = centerX - containerHalfWidth;
    const rightX = centerX + containerHalfWidth;

    const containerPath = `
      M ${leftX} ${containerTop}
      L ${leftX} ${containerBottom}
      Q ${leftX} ${containerBottom + 10} ${leftX + 10} ${containerBottom + 10}
      L ${rightX - 10} ${containerBottom + 10}
      Q ${rightX} ${containerBottom + 10} ${rightX} ${containerBottom}
      L ${rightX} ${containerTop}
    `;

    const waterTop = Math.max(waterLevelY, containerTop);
    const waterPath = `
      M ${leftX + 2} ${waterTop}
      L ${leftX + 2} ${containerBottom - 2}
      L ${rightX - 2} ${containerBottom - 2}
      L ${rightX - 2} ${waterTop}
      Q ${centerX} ${waterTop - 3} ${leftX + 2} ${waterTop}
    `;

    return {
      containerPath,
      waterPath,
      waterSurfaceRx: (maxWidth / 2) * 0.9,
      waterSurfaceRy: 4,
      apertureY: containerBottom - 5,
    };
  }

  getVolume(
    containerSize: number,
    waterHeight: number,
    _initialWaterHeight: number
  ): number {
    return this.getCrossSectionArea(containerSize, waterHeight, _initialWaterHeight) * waterHeight;
  }

  getEffectiveWaterHeight(
    _containerSize: number,
    waterHeight: number,
    _initialWaterHeight: number
  ): number {
    return waterHeight;
  }
}

export class ConeStrategy implements ContainerStrategy {
  readonly shape: ContainerShape = 'cone';
  readonly label = '圆锥体';
  readonly icon = 'cone';

  getCrossSectionArea(
    containerSize: number,
    waterHeight: number,
    initialWaterHeight: number
  ): number {
    const radiusAtTop = containerSize / 2;
    const radiusAtHeight = radiusAtTop * (waterHeight / initialWaterHeight);
    return Math.PI * radiusAtHeight * radiusAtHeight;
  }

  getWaterHeightChangeRate(
    waterHeight: number,
    containerSize: number,
    initialWaterHeight: number,
    apertureArea: number
  ): number {
    if (waterHeight <= MIN_WATER_HEIGHT) return 0;
    const containerArea = this.getCrossSectionArea(containerSize, waterHeight, initialWaterHeight);
    const velocity = Math.sqrt(2 * GRAVITY * (waterHeight / 100));
    const flowRate = DISCHARGE_COEFFICIENT * velocity * 100 * apertureArea;
    return -flowRate / containerArea;
  }

  getSvgGeometry(params: {
    centerX: number;
    containerTop: number;
    containerBottom: number;
    maxWidth: number;
    waterLevelY: number;
    containerHeight: number;
  }): ContainerGeometry {
    const { centerX, containerTop, containerBottom, maxWidth, waterLevelY, containerHeight } = params;
    const containerHalfWidth = maxWidth / 2;
    const topLeftX = centerX - containerHalfWidth;
    const topRightX = centerX + containerHalfWidth;

    const containerPath = `
      M ${topLeftX} ${containerTop}
      L ${centerX} ${containerBottom}
      L ${topRightX} ${containerTop}
      M ${topLeftX} ${containerTop}
      Q ${topLeftX - 5} ${containerTop} ${topLeftX - 5} ${containerTop + 8}
      L ${topRightX + 5} ${containerTop + 8}
      Q ${topRightX + 5} ${containerTop} ${topRightX} ${containerTop}
    `;

    const waterTop = Math.max(waterLevelY, containerTop);
    const waterRatio = (waterTop - containerTop) / containerHeight;
    const waterHalfWidth = containerHalfWidth * (1 - waterRatio);

    const waterPath = `
      M ${centerX - waterHalfWidth + 2} ${waterTop}
      L ${centerX - waterHalfWidth * 0.5} ${containerBottom - 2}
      L ${centerX + waterHalfWidth * 0.5} ${containerBottom - 2}
      L ${centerX + waterHalfWidth - 2} ${waterTop}
      Q ${centerX} ${waterTop - 2} ${centerX - waterHalfWidth + 2} ${waterTop}
    `;

    return {
      containerPath,
      waterPath,
      waterSurfaceRx: (maxWidth / 2) * ((containerBottom - waterLevelY) / containerHeight) * 0.9,
      waterSurfaceRy: 3,
      apertureY: containerBottom - 5,
    };
  }

  getVolume(
    containerSize: number,
    waterHeight: number,
    initialWaterHeight: number
  ): number {
    const radiusAtTop = containerSize / 2;
    const radiusAtHeight = radiusAtTop * (waterHeight / initialWaterHeight);
    return (1 / 3) * Math.PI * radiusAtHeight * radiusAtHeight * waterHeight;
  }

  getEffectiveWaterHeight(
    _containerSize: number,
    waterHeight: number,
    _initialWaterHeight: number
  ): number {
    return waterHeight;
  }
}

export class CubeStrategy implements ContainerStrategy {
  readonly shape: ContainerShape = 'cube';
  readonly label = '立方体';
  readonly icon = 'box';

  getCrossSectionArea(
    containerSize: number,
    _waterHeight: number,
    _initialWaterHeight: number
  ): number {
    return containerSize * containerSize;
  }

  getWaterHeightChangeRate(
    waterHeight: number,
    containerSize: number,
    _initialWaterHeight: number,
    apertureArea: number
  ): number {
    if (waterHeight <= MIN_WATER_HEIGHT) return 0;
    const containerArea = this.getCrossSectionArea(containerSize, waterHeight, _initialWaterHeight);
    const velocity = Math.sqrt(2 * GRAVITY * (waterHeight / 100));
    const flowRate = DISCHARGE_COEFFICIENT * velocity * 100 * apertureArea;
    return -flowRate / containerArea;
  }

  getSvgGeometry(params: {
    centerX: number;
    containerTop: number;
    containerBottom: number;
    maxWidth: number;
    waterLevelY: number;
  }): ContainerGeometry {
    const { centerX, containerTop, containerBottom, maxWidth, waterLevelY } = params;
    const containerHalfWidth = maxWidth / 2;
    const leftX = centerX - containerHalfWidth;
    const rightX = centerX + containerHalfWidth;

    const containerPath = `
      M ${leftX} ${containerTop}
      L ${leftX} ${containerBottom}
      L ${rightX} ${containerBottom}
      L ${rightX} ${containerTop}
      M ${leftX} ${containerTop}
      L ${leftX - 15} ${containerTop - 15}
      L ${rightX - 15} ${containerTop - 15}
      L ${rightX} ${containerTop}
      M ${rightX} ${containerTop}
      L ${rightX - 15} ${containerTop - 15}
      M ${rightX} ${containerBottom}
      L ${rightX - 15} ${containerBottom - 15}
      L ${rightX - 15} ${containerTop - 15}
    `;

    const waterTop = Math.max(waterLevelY, containerTop);
    const waterPath = `
      M ${leftX + 2} ${waterTop}
      L ${leftX + 2} ${containerBottom - 2}
      L ${rightX - 2} ${containerBottom - 2}
      L ${rightX - 2} ${waterTop}
      L ${leftX + 2} ${waterTop}
    `;

    return {
      containerPath,
      waterPath,
      waterSurfaceRx: (maxWidth / 2) * 0.9,
      waterSurfaceRy: 4,
      apertureY: containerBottom - 5,
    };
  }

  getVolume(
    containerSize: number,
    waterHeight: number,
    _initialWaterHeight: number
  ): number {
    return this.getCrossSectionArea(containerSize, waterHeight, _initialWaterHeight) * waterHeight;
  }

  getEffectiveWaterHeight(
    _containerSize: number,
    waterHeight: number,
    _initialWaterHeight: number
  ): number {
    return waterHeight;
  }
}

const strategyRegistry = new Map<ContainerShape, ContainerStrategy>();

function registerStrategy(strategy: ContainerStrategy): void {
  strategyRegistry.set(strategy.shape, strategy);
}

registerStrategy(new CylinderStrategy());
registerStrategy(new ConeStrategy());
registerStrategy(new CubeStrategy());

export function getContainerStrategy(shape: ContainerShape): ContainerStrategy {
  const strategy = strategyRegistry.get(shape);
  if (!strategy) {
    throw new Error(`Unknown container shape: ${shape}`);
  }
  return strategy;
}

export function getAllStrategies(): ContainerStrategy[] {
  return Array.from(strategyRegistry.values());
}

export function registerCustomStrategy(strategy: ContainerStrategy): void {
  strategyRegistry.set(strategy.shape, strategy);
}
