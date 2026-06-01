export type QueenPositions = number[];

export type ActionType = 'place' | 'conflict' | 'backtrack' | 'solution';

export interface AlgorithmStep {
  row: number;
  col: number;
  action: ActionType;
  board: QueenPositions;
  conflictCells: [number, number][];
  description: string;
}

export interface SolutionStats {
  n: number;
  count: number;
}

export interface AppState {
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
  solveTime: number;
  animationStartTime: number;
  animationElapsed: number;
}
