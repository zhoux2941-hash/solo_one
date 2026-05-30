import { create } from "zustand";
import {
  type Grid,
  type BoundaryMode,
  createGrid,
  nextGeneration,
  randomize as randomizeGrid,
  clearGrid,
  countAlive,
  cloneGrid,
  setCell,
} from "@/utils/gameEngine";
import type { Preset } from "@/utils/presets";

interface GameState {
  grid: Grid;
  rows: number;
  cols: number;
  generation: number;
  aliveCells: number;
  isRunning: boolean;
  speed: number;
  showGridLines: boolean;
  initialGrid: Grid;
  survivalProbability: number;
  boundaryMode: BoundaryMode;
  adaptiveSpeed: boolean;

  toggleCell: (row: number, col: number) => void;
  step: () => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  clear: () => void;
  setGridSize: (rows: number, cols: number) => void;
  setSpeed: (speed: number) => void;
  toggleGridLines: () => void;
  loadPreset: (preset: Preset) => void;
  randomize: (probability: number) => void;
  setSurvivalProbability: (probability: number) => void;
  setBoundaryMode: (mode: BoundaryMode) => void;
  toggleAdaptiveSpeed: () => void;
  getEffectiveSpeed: () => number;
  loadGrid: (newGrid: Grid) => void;
}

const DEFAULT_ROWS = 50;
const DEFAULT_COLS = 50;

const useGameStore = create<GameState>((set, get) => ({
  grid: createGrid(DEFAULT_ROWS, DEFAULT_COLS),
  rows: DEFAULT_ROWS,
  cols: DEFAULT_COLS,
  generation: 0,
  aliveCells: 0,
  isRunning: false,
  speed: 150,
  showGridLines: true,
  initialGrid: createGrid(DEFAULT_ROWS, DEFAULT_COLS),
  survivalProbability: 0.3,
  boundaryMode: "toroidal" as BoundaryMode,
  adaptiveSpeed: false,

  toggleCell: (row: number, col: number) => {
    const { grid, cols } = get();
    const newGrid = cloneGrid(grid);
    const idx = row * cols + col;
    newGrid[idx] = newGrid[idx] ? 0 : 1;
    set({
      grid: newGrid,
      aliveCells: countAlive(newGrid),
      initialGrid: cloneGrid(newGrid),
    });
  },

  step: () => {
    const { grid, rows, cols, boundaryMode } = get();
    const newGrid = nextGeneration(grid, rows, cols, boundaryMode);
    set({
      grid: newGrid,
      generation: get().generation + 1,
      aliveCells: countAlive(newGrid),
    });
  },

  start: () => set({ isRunning: true }),
  pause: () => set({ isRunning: false }),

  reset: () => {
    const { initialGrid } = get();
    set({
      grid: cloneGrid(initialGrid),
      generation: 0,
      aliveCells: countAlive(initialGrid),
      isRunning: false,
    });
  },

  clear: () => {
    const { rows, cols } = get();
    const newGrid = clearGrid(rows, cols);
    set({
      grid: newGrid,
      initialGrid: cloneGrid(newGrid),
      generation: 0,
      aliveCells: 0,
      isRunning: false,
    });
  },

  setGridSize: (rows: number, cols: number) => {
    const newGrid = createGrid(rows, cols);
    set({
      grid: newGrid,
      initialGrid: cloneGrid(newGrid),
      rows,
      cols,
      generation: 0,
      aliveCells: 0,
      isRunning: false,
    });
  },

  setSpeed: (speed: number) => set({ speed }),
  toggleGridLines: () => set((s) => ({ showGridLines: !s.showGridLines })),

  loadPreset: (preset: Preset) => {
    const { rows, cols } = get();
    const newGrid = createGrid(rows, cols);
    const centerR = Math.floor(rows / 2);
    const centerC = Math.floor(cols / 2);
    for (const [r, c] of preset.cells) {
      const nr = centerR + r;
      const nc = centerC + c;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        setCell(newGrid, cols, nr, nc, 1);
      }
    }
    set({
      grid: newGrid,
      initialGrid: cloneGrid(newGrid),
      generation: 0,
      aliveCells: countAlive(newGrid),
      isRunning: false,
    });
  },

  randomize: (probability: number) => {
    const { rows, cols } = get();
    const newGrid = randomizeGrid(rows, cols, probability);
    set({
      grid: newGrid,
      initialGrid: cloneGrid(newGrid),
      generation: 0,
      aliveCells: countAlive(newGrid),
      isRunning: false,
    });
  },

  setSurvivalProbability: (probability: number) =>
    set({ survivalProbability: probability }),

  setBoundaryMode: (mode: BoundaryMode) =>
    set({ boundaryMode: mode }),

  toggleAdaptiveSpeed: () =>
    set((s) => ({ adaptiveSpeed: !s.adaptiveSpeed })),

  getEffectiveSpeed: () => {
    const { adaptiveSpeed, speed, aliveCells, rows, cols } = get();
    if (!adaptiveSpeed) return speed;
    const density = aliveCells / (rows * cols);
    const minSpeed = 50;
    const maxSpeed = 500;
    const speedRange = maxSpeed - minSpeed;
    const adjustedSpeed = speed * (1.6 - density * 2.4);
    return Math.max(minSpeed, Math.min(maxSpeed, adjustedSpeed));
  },

  loadGrid: (newGrid: Grid) => {
    if (newGrid.length !== get().rows * get().cols) {
      return;
    }
    const grid = cloneGrid(newGrid);
    set({
      grid,
      initialGrid: cloneGrid(grid),
      generation: 0,
      aliveCells: countAlive(grid),
      isRunning: false,
    });
  },
}));

export default useGameStore;
