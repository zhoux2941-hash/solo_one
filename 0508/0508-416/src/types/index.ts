export enum NumberStatus {
  UNPROCESSED = 'unprocessed',
  PRIME = 'prime',
  COMPOSITE = 'composite',
  CURRENT = 'current',
  BEING_MARKED = 'being_marked',
}

export interface NumberItem {
  value: number;
  status: NumberStatus;
  showStrike: boolean;
}

export type Speed = 'slow' | 'medium' | 'fast';

export interface SpeedConfig {
  markDelay: number;
  stepDelay: number;
}

export interface SieveState {
  n: number;
  numbers: NumberItem[];
  currentPrime: number | null;
  isRunning: boolean;
  isCompleted: boolean;
  speed: Speed;
  stepsCompleted: number;
  totalSteps: number;
  primeCount: number;
  isPaused: boolean;
}

export const SPEED_CONFIG: Record<Speed, SpeedConfig> = {
  slow: { markDelay: 200, stepDelay: 1000 },
  medium: { markDelay: 80, stepDelay: 500 },
  fast: { markDelay: 30, stepDelay: 200 },
};

export const MIN_N = 2;
export const MAX_N = 10000;
