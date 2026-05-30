export type RodId = 'A' | 'B' | 'C';

export interface Disk {
  id: number;
  size: number;
  color: string;
}

export interface MoveStep {
  from: RodId;
  to: RodId;
  disk: number;
  description: string;
}

export interface RecursionNode {
  id: string;
  n: number;
  from: RodId;
  to: RodId;
  aux: RodId;
  depth: number;
  isActive: boolean;
  isCompleted: boolean;
}

export type Speed = 'slow' | 'medium' | 'fast';

export interface AnimationState {
  isAnimating: boolean;
  currentAnimation: MoveStep | null;
}

export interface HanoiState {
  diskCount: number;
  rods: Record<RodId, Disk[]>;
  currentStep: number;
  totalSteps: number;
  manualSteps: number;
  isPlaying: boolean;
  speed: Speed;
  moveHistory: MoveStep[];
  optimalSteps: number;
  recursionStack: RecursionNode[];
  solutionSteps: MoveStep[];
  isComplete: boolean;
  animationState: AnimationState;
}

export interface HanoiActions {
  setDiskCount: (count: number) => void;
  moveDisk: (from: RodId, to: RodId) => boolean;
  undoMove: () => void;
  startAutoPlay: () => void;
  stopAutoPlay: () => void;
  setSpeed: (speed: Speed) => void;
  reset: () => void;
  stepForward: () => Promise<void>;
  stepBackward: () => void;
  setAnimationState: (state: Partial<AnimationState>) => void;
}

export type HanoiStore = HanoiState & HanoiActions;
