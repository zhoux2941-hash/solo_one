import { CellState, SimulationParams, SimulationStats, WindDirection } from './types';
import { CellGrid } from './CellGrid';
import { GRID_SIZE, WIND_VECTORS, DEFAULT_PARAMS, NEIGHBOR_OFFSETS, FIREFIGHTER_EXTINGUISH_RADIUS, FIREFIGHTER_EXTINGUISH_PROBABILITY } from './constants';

const NEIGHBOR_COUNT = NEIGHBOR_OFFSETS.length;

type SpreadFactors = Float64Array;

export class FireSimulator {
  private grid: CellGrid;
  private nextGrid: CellGrid;
  private params: SimulationParams;
  private totalTrees: number;
  private timeStep: number;
  private spreadFactors: SpreadFactors;
  private cachedWindDir: WindDirection | null = null;
  private cachedWindStrength: number = -1;
  private cachedHumidity: number = -1;
  private cachedSpreadRate: number = -1;

  constructor(size: number = GRID_SIZE) {
    this.grid = new CellGrid(size);
    this.nextGrid = new CellGrid(size);
    this.params = { ...DEFAULT_PARAMS };
    this.totalTrees = 0;
    this.timeStep = 0;
    this.spreadFactors = new Float64Array(NEIGHBOR_COUNT);
  }

  initialize(treeDensity?: number): void {
    const density = treeDensity ?? this.params.treeDensity;
    this.totalTrees = this.grid.initialize(density);
    this.nextGrid.copyFrom(this.grid);
    this.timeStep = 0;
  }

  setParams(params: Partial<SimulationParams>): void {
    this.params = { ...this.params, ...params };
  }

  getParams(): SimulationParams {
    return { ...this.params };
  }

  getGrid(): CellGrid {
    return this.grid;
  }

  getTimeStep(): number {
    return this.timeStep;
  }

  ignite(x: number, y: number): boolean {
    if (this.grid.getState(x, y) === CellState.TREE) {
      this.grid.setState(x, y, CellState.FIRE);
      this.nextGrid.setState(x, y, CellState.FIRE);
      return true;
    }
    return false;
  }

  placeFirefighter(x: number, y: number): boolean {
    const state = this.grid.getState(x, y);
    if (state === CellState.EMPTY || state === CellState.ASH) {
      this.grid.setState(x, y, CellState.FIREFIGHTER);
      this.nextGrid.setState(x, y, CellState.FIREFIGHTER);
      return true;
    }
    return false;
  }

  private extinguishFire(): void {
    const firefighters = this.grid.getFirefighters();
    
    for (const firefighter of firefighters) {
      const nearbyCells = this.grid.getCellsInRadius(
        firefighter.x,
        firefighter.y,
        FIREFIGHTER_EXTINGUISH_RADIUS
      );
      
      for (const cell of nearbyCells) {
        if (cell.state === CellState.FIRE) {
          if (Math.random() < FIREFIGHTER_EXTINGUISH_PROBABILITY) {
            this.nextGrid.setState(cell.x, cell.y, CellState.ASH);
          }
        }
      }
    }
  }

  private rebuildSpreadFactors(): void {
    const { windDirection, windStrength, humidity, spreadRate } = this.params;

    if (
      windDirection === this.cachedWindDir &&
      windStrength === this.cachedWindStrength &&
      humidity === this.cachedHumidity &&
      spreadRate === this.cachedSpreadRate
    ) {
      return;
    }

    this.cachedWindDir = windDirection;
    this.cachedWindStrength = windStrength;
    this.cachedHumidity = humidity;
    this.cachedSpreadRate = spreadRate;

    const wind = WIND_VECTORS[windDirection];
    const windDx = wind.dx;
    const windDy = wind.dy;
    const windMag = Math.sqrt(windDx * windDx + windDy * windDy);
    const humidityIndex = Math.exp(-humidity / 50);

    for (let i = 0; i < NEIGHBOR_COUNT; i++) {
      const spreadDx = NEIGHBOR_OFFSETS[i][0];
      const spreadDy = NEIGHBOR_OFFSETS[i][1];
      const spreadMag = Math.sqrt(spreadDx * spreadDx + spreadDy * spreadDy);

      const dotProduct = spreadDx * windDx + spreadDy * windDy;
      const cosAngle = windMag > 0 && spreadMag > 0
        ? dotProduct / (spreadMag * windMag)
        : 0;

      const windFactor = 1 + cosAngle * windStrength;
      const clampedWind = Math.max(0.2, Math.min(2.5, windFactor));

      this.spreadFactors[i] = Math.min(1.0, spreadRate * humidityIndex * clampedWind);
    }
  }

  step(): void {
    this.nextGrid.copyFrom(this.grid);
    this.rebuildSpreadFactors();
    
    const burningCells = this.grid.getBurningCells();
    const gridSize = this.grid.getSize();
    
    for (const cell of burningCells) {
      for (let k = 0; k < NEIGHBOR_COUNT; k++) {
        const nx = cell.x + NEIGHBOR_OFFSETS[k][0];
        const ny = cell.y + NEIGHBOR_OFFSETS[k][1];
        
        if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize) continue;
        if (this.grid.getState(nx, ny) !== CellState.TREE) continue;
        
        if (Math.random() < this.spreadFactors[k]) {
          this.nextGrid.setState(nx, ny, CellState.FIRE);
        }
      }
    }
    
    for (const cell of burningCells) {
      this.nextGrid.incrementBurnTime(cell.x, cell.y);
      const burnTime = this.nextGrid.getBurnTime(cell.x, cell.y);
      
      if (burnTime >= this.params.burnDuration) {
        this.nextGrid.setState(cell.x, cell.y, CellState.ASH);
      }
    }
    
    this.extinguishFire();
    
    const temp = this.grid;
    this.grid = this.nextGrid;
    this.nextGrid = temp;
    
    this.timeStep++;
  }

  getStats(): SimulationStats {
    const counts = this.grid.countStates();
    const burnedArea = counts.burning + counts.burned;
    
    return {
      totalTrees: this.totalTrees,
      burningTrees: counts.burning,
      burnedTrees: counts.burned,
      burnedArea,
      survivalRate: this.totalTrees > 0 
        ? ((counts.trees / this.totalTrees) * 100) 
        : 0,
      timeStep: this.timeStep,
      firefighterCount: counts.firefighters,
    };
  }

  isBurning(): boolean {
    return this.grid.getBurningCells().length > 0;
  }

  reset(): void {
    this.cachedWindDir = null;
    this.cachedWindStrength = -1;
    this.cachedHumidity = -1;
    this.cachedSpreadRate = -1;
    this.initialize();
  }
}
