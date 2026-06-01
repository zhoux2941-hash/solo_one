import { SolutionStats } from '@/types';

export const MIN_BOARD_SIZE = 4;
export const MAX_BOARD_SIZE = 12;
export const DEFAULT_BOARD_SIZE = 8;
export const DEFAULT_SPEED = 500;
export const MIN_SPEED = 100;
export const MAX_SPEED = 2000;

export const SOLUTION_STATS: SolutionStats[] = [
  { n: 4, count: 2 },
  { n: 5, count: 10 },
  { n: 6, count: 4 },
  { n: 7, count: 40 },
  { n: 8, count: 92 },
  { n: 9, count: 352 },
  { n: 10, count: 724 },
  { n: 11, count: 2680 },
  { n: 12, count: 14200 },
];
