import { create } from 'zustand';
import { QueenPositions, AlgorithmStep } from '@/types';
import { DEFAULT_BOARD_SIZE, DEFAULT_SPEED } from '@/constants';
import { generateBacktrackingSteps } from '@/utils/backtracking';

interface AppState {
  boardSize: number;
  animationSpeed: number;
  isStepMode: boolean;
  isRunning: boolean;
  isPaused: boolean;
  currentStepIndex: number;
  steps: AlgorithmStep[];
  solutions: QueenPositions[];
  currentSolutionIndex: number;
  currentBoard: QueenPositions;
  conflictCells: [number, number][];
  currentAttemptCell: [number, number] | null;
  isComplete: boolean;
  foundSolutions: number;
  currentDescription: string;
  solveTime: number;
  animationStartTime: number;
  animationElapsed: number;

  setBoardSize: (size: number) => void;
  setAnimationSpeed: (speed: number) => void;
  setStepMode: (isStep: boolean) => void;
  startAnimation: () => void;
  pauseAnimation: () => void;
  resumeAnimation: () => void;
  resetAnimation: () => void;
  stepForward: () => void;
  nextSolution: () => void;
  prevSolution: () => void;
  goToSolution: (index: number) => void;
  initializeSolver: () => void;
  updateToStep: (stepIndex: number) => void;
  tickAnimationElapsed: () => void;
}

const createEmptyBoard = (size: number): QueenPositions => {
  return new Array(size).fill(-1);
};

export const useAppStore = create<AppState>((set, get) => ({
  boardSize: DEFAULT_BOARD_SIZE,
  animationSpeed: DEFAULT_SPEED,
  isStepMode: false,
  isRunning: false,
  isPaused: false,
  currentStepIndex: -1,
  steps: [],
  solutions: [],
  currentSolutionIndex: 0,
  currentBoard: createEmptyBoard(DEFAULT_BOARD_SIZE),
  conflictCells: [],
  currentAttemptCell: null,
  isComplete: false,
  foundSolutions: 0,
  currentDescription: '准备开始',
  solveTime: 0,
  animationStartTime: 0,
  animationElapsed: 0,

  setBoardSize: (size: number) => {
    set({
      boardSize: size,
      currentBoard: createEmptyBoard(size),
    });
    get().initializeSolver();
  },

  setAnimationSpeed: (speed: number) => {
    set({ animationSpeed: speed });
  },

  setStepMode: (isStep: boolean) => {
    set({ isStepMode: isStep });
  },

  startAnimation: () => {
    const { steps, animationElapsed } = get();
    if (steps.length === 0) {
      get().initializeSolver();
    }
    set({
      isRunning: true,
      isPaused: false,
      animationStartTime: performance.now() - animationElapsed,
    });
  },

  pauseAnimation: () => {
    const { animationStartTime } = get();
    set({
      isPaused: true,
      isRunning: false,
      animationElapsed: performance.now() - animationStartTime,
    });
  },

  resumeAnimation: () => {
    const { animationElapsed } = get();
    set({
      isPaused: false,
      isRunning: true,
      animationStartTime: performance.now() - animationElapsed,
    });
  },

  resetAnimation: () => {
    const { boardSize } = get();
    set({
      isRunning: false,
      isPaused: false,
      currentStepIndex: -1,
      currentBoard: createEmptyBoard(boardSize),
      conflictCells: [],
      currentAttemptCell: null,
      isComplete: false,
      foundSolutions: 0,
      currentDescription: '准备开始',
      currentSolutionIndex: 0,
      animationStartTime: 0,
      animationElapsed: 0,
    });
  },

  stepForward: () => {
    const { currentStepIndex, steps, isComplete } = get();

    if (isComplete || currentStepIndex >= steps.length - 1) {
      return;
    }

    const nextIndex = currentStepIndex + 1;
    get().updateToStep(nextIndex);
  },

  nextSolution: () => {
    const { solutions, currentSolutionIndex } = get();
    if (currentSolutionIndex < solutions.length - 1) {
      const nextIndex = currentSolutionIndex + 1;
      get().goToSolution(nextIndex);
    }
  },

  prevSolution: () => {
    const { currentSolutionIndex } = get();
    if (currentSolutionIndex > 0) {
      const prevIndex = currentSolutionIndex - 1;
      get().goToSolution(prevIndex);
    }
  },

  goToSolution: (index: number) => {
    const { solutions } = get();
    if (index >= 0 && index < solutions.length) {
      set({
        currentSolutionIndex: index,
        currentBoard: [...solutions[index]],
        conflictCells: [],
        currentAttemptCell: null,
        isRunning: false,
        isPaused: false,
        isComplete: true,
        currentDescription: `查看第 ${index + 1} 个解（共 ${solutions.length} 个）`,
      });
    }
  },

  initializeSolver: () => {
    const { boardSize } = get();
    const t0 = performance.now();
    const { steps, solutions } = generateBacktrackingSteps(boardSize);
    const solveTime = performance.now() - t0;

    set({
      steps,
      solutions,
      currentStepIndex: -1,
      currentBoard: createEmptyBoard(boardSize),
      conflictCells: [],
      currentAttemptCell: null,
      isComplete: false,
      foundSolutions: 0,
      currentDescription: `已生成 ${steps.length} 个步骤，${solutions.length} 个解`,
      currentSolutionIndex: 0,
      solveTime,
      animationStartTime: 0,
      animationElapsed: 0,
    });
  },

  updateToStep: (stepIndex: number) => {
    const { steps, solutions } = get();

    if (stepIndex < 0 || stepIndex >= steps.length) {
      return;
    }

    const step = steps[stepIndex];
    const isComplete = stepIndex === steps.length - 1;

    let foundSolutions = get().foundSolutions;
    let currentSolutionIndex = get().currentSolutionIndex;
    if (step.action === 'solution') {
      foundSolutions++;
      currentSolutionIndex = foundSolutions - 1;
    }

    set({
      currentStepIndex: stepIndex,
      currentBoard: [...step.board],
      conflictCells: step.conflictCells,
      currentAttemptCell: [step.row, step.col],
      isComplete,
      foundSolutions,
      currentSolutionIndex,
      currentDescription: step.description,
      isRunning: isComplete ? false : get().isRunning,
    });

    if (isComplete && solutions.length > 0) {
      const finalElapsed = performance.now() - get().animationStartTime;
      set({
        currentBoard: [...solutions[currentSolutionIndex]],
        currentDescription: `求解完成！共找到 ${solutions.length} 个解，当前显示第 ${currentSolutionIndex + 1} 个`,
        animationElapsed: finalElapsed,
      });
    }
  },

  tickAnimationElapsed: () => {
    const { isRunning, animationStartTime } = get();
    if (isRunning && animationStartTime > 0) {
      set({ animationElapsed: performance.now() - animationStartTime });
    }
  },
}));
