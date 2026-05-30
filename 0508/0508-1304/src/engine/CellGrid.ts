import { CellState, CellData } from './types';
import { GRID_SIZE, NEIGHBOR_OFFSETS } from './constants';

export class CellGrid {
  private size: number;
  private states: Uint8Array;
  private burnTimes: Int8Array;

  constructor(size: number = GRID_SIZE) {
    this.size = size;
    this.states = new Uint8Array(size * size);
    this.burnTimes = new Int8Array(size * size);
  }

  getSize(): number {
    return this.size;
  }

  getIndex(x: number, y: number): number {
    return y * this.size + x;
  }

  isValid(x: number, y: number): boolean {
    return x >= 0 && x < this.size && y >= 0 && y < this.size;
  }

  getState(x: number, y: number): CellState {
    if (!this.isValid(x, y)) return CellState.EMPTY;
    return this.states[this.getIndex(x, y)];
  }

  setState(x: number, y: number, state: CellState): void {
    if (!this.isValid(x, y)) return;
    const idx = this.getIndex(x, y);
    this.states[idx] = state;
    if (state === CellState.FIRE) {
      this.burnTimes[idx] = 0;
    }
  }

  getBurnTime(x: number, y: number): number {
    if (!this.isValid(x, y)) return -1;
    return this.burnTimes[this.getIndex(x, y)];
  }

  incrementBurnTime(x: number, y: number): void {
    if (!this.isValid(x, y)) return;
    this.burnTimes[this.getIndex(x, y)]++;
  }

  getCellData(x: number, y: number): CellData {
    return {
      x,
      y,
      state: this.getState(x, y),
      burnTime: this.getBurnTime(x, y),
    };
  }

  getNeighbors(x: number, y: number): CellData[] {
    const neighbors: CellData[] = [];
    for (const [dx, dy] of NEIGHBOR_OFFSETS) {
      const nx = x + dx;
      const ny = y + dy;
      if (this.isValid(nx, ny)) {
        neighbors.push(this.getCellData(nx, ny));
      }
    }
    return neighbors;
  }

  getBurningCells(): CellData[] {
    const burning: CellData[] = [];
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.getState(x, y) === CellState.FIRE) {
          burning.push(this.getCellData(x, y));
        }
      }
    }
    return burning;
  }

  getFirefighters(): CellData[] {
    const firefighters: CellData[] = [];
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.getState(x, y) === CellState.FIREFIGHTER) {
          firefighters.push(this.getCellData(x, y));
        }
      }
    }
    return firefighters;
  }

  getCellsInRadius(centerX: number, centerY: number, radius: number): CellData[] {
    const cells: CellData[] = [];
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        if (this.isValid(x, y) && (dx !== 0 || dy !== 0)) {
          cells.push(this.getCellData(x, y));
        }
      }
    }
    return cells;
  }

  initialize(treeDensity: number): number {
    let totalTrees = 0;
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const idx = this.getIndex(x, y);
        if (Math.random() * 100 < treeDensity) {
          this.states[idx] = CellState.TREE;
          totalTrees++;
        } else {
          this.states[idx] = CellState.EMPTY;
        }
        this.burnTimes[idx] = 0;
      }
    }
    return totalTrees;
  }

  copyFrom(other: CellGrid): void {
    this.states.set(other.states);
    this.burnTimes.set(other.burnTimes);
  }

  clone(): CellGrid {
    const newGrid = new CellGrid(this.size);
    newGrid.copyFrom(this);
    return newGrid;
  }

  countStates(): { trees: number; burning: number; burned: number; empty: number; firefighters: number } {
    let trees = 0;
    let burning = 0;
    let burned = 0;
    let empty = 0;
    let firefighters = 0;

    for (let i = 0; i < this.states.length; i++) {
      switch (this.states[i]) {
        case CellState.TREE:
          trees++;
          break;
        case CellState.FIRE:
          burning++;
          break;
        case CellState.ASH:
          burned++;
          break;
        case CellState.FIREFIGHTER:
          firefighters++;
          break;
        default:
          empty++;
      }
    }

    return { trees, burning, burned, empty, firefighters };
  }
}
