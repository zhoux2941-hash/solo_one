import { create } from 'zustand';
import type { Disk, RodId, Speed, MoveStep, HanoiStore } from '../types/hanoi';
import {
  calculateOptimalSteps,
  generateSolutionSteps,
  validateMove,
  checkCompletion
} from '../utils/hanoiSolver';
import { getDiskColor } from '../utils/colorUtils';

function createInitialDisks(count: number): Disk[] {
  const disks: Disk[] = [];
  for (let i = count; i >= 1; i--) {
    disks.push({
      id: i,
      size: i,
      color: getDiskColor(i, count)
    });
  }
  return disks;
}

function createInitialRods(diskCount: number): Record<RodId, Disk[]> {
  return {
    A: createInitialDisks(diskCount),
    B: [],
    C: []
  };
}

export const useHanoiStore = create<HanoiStore>((set, get) => ({
  diskCount: 3,
  rods: createInitialRods(3),
  currentStep: 0,
  totalSteps: 0,
  manualSteps: 0,
  isPlaying: false,
  speed: 'medium',
  moveHistory: [],
  optimalSteps: calculateOptimalSteps(3),
  recursionStack: [],
  solutionSteps: generateSolutionSteps(3),
  isComplete: false,

  setDiskCount: (count: number) => {
    const optimalSteps = calculateOptimalSteps(count);
    const solutionSteps = generateSolutionSteps(count);
    set({
      diskCount: count,
      rods: createInitialRods(count),
      currentStep: 0,
      totalSteps: 0,
      manualSteps: 0,
      isPlaying: false,
      moveHistory: [],
      optimalSteps,
      solutionSteps,
      isComplete: false
    });
  },

  moveDisk: (from: RodId, to: RodId): boolean => {
    const state = get();
    const { rods } = state;

    if (!validateMove(rods, from, to)) {
      return false;
    }

    const fromRod = [...rods[from]];
    const toRod = [...rods[to]];
    const disk = fromRod.pop()!;
    toRod.push(disk);

    const newRods = { ...rods, [from]: fromRod, [to]: toRod };
    const newTotalSteps = state.totalSteps + 1;
    const newManualSteps = state.manualSteps + 1;
    const isComplete = checkCompletion(newRods, 'C', state.diskCount);

    const moveStep: MoveStep = {
      from,
      to,
      disk: disk.size,
      description: `移动盘子 ${disk.size} 从 ${from} 到 ${to}`
    };

    set({
      rods: newRods,
      totalSteps: newTotalSteps,
      manualSteps: newManualSteps,
      moveHistory: [...state.moveHistory, moveStep],
      isComplete
    });

    return true;
  },

  undoMove: () => {
    const state = get();
    if (state.moveHistory.length === 0) return;

    const newHistory = [...state.moveHistory];
    const lastMove = newHistory.pop()!;

    const rods = { ...state.rods };
    const fromRod = [...rods[lastMove.to]];
    const toRod = [...rods[lastMove.from]];
    const disk = fromRod.pop()!;
    toRod.push(disk);

    set({
      rods: { ...rods, [lastMove.to]: fromRod, [lastMove.from]: toRod },
      totalSteps: state.totalSteps - 1,
      manualSteps: Math.max(0, state.manualSteps - 1),
      moveHistory: newHistory,
      isComplete: false
    });
  },

  redoMove: () => {},

  startAutoPlay: () => {
    set({ isPlaying: true });
  },

  stopAutoPlay: () => {
    set({ isPlaying: false });
  },

  setSpeed: (speed: Speed) => {
    set({ speed });
  },

  reset: () => {
    const state = get();
    set({
      rods: createInitialRods(state.diskCount),
      currentStep: 0,
      totalSteps: 0,
      manualSteps: 0,
      isPlaying: false,
      moveHistory: [],
      isComplete: false
    });
  },

  stepForward: () => {
    const state = get();
    const { currentStep, solutionSteps, rods, diskCount } = state;

    if (currentStep >= solutionSteps.length) return;

    const step = solutionSteps[currentStep];
    const fromRod = [...rods[step.from]];
    const toRod = [...rods[step.to]];
    const disk = fromRod.pop()!;
    toRod.push(disk);

    const newRods = { ...rods, [step.from]: fromRod, [step.to]: toRod };
    const isComplete = checkCompletion(newRods, 'C', diskCount);

    set({
      rods: newRods,
      currentStep: currentStep + 1,
      totalSteps: state.totalSteps + 1,
      moveHistory: [...state.moveHistory, step],
      isComplete
    });
  },

  stepBackward: () => {
    const state = get();
    if (state.currentStep <= 0 || state.moveHistory.length === 0) return;

    const newHistory = [...state.moveHistory];
    const lastMove = newHistory.pop()!;

    const rods = { ...state.rods };
    const fromRod = [...rods[lastMove.to]];
    const toRod = [...rods[lastMove.from]];
    const disk = fromRod.pop()!;
    toRod.push(disk);

    set({
      rods: { ...rods, [lastMove.to]: fromRod, [lastMove.from]: toRod },
      currentStep: state.currentStep - 1,
      totalSteps: state.totalSteps - 1,
      moveHistory: newHistory,
      isComplete: false
    });
  }
}));
