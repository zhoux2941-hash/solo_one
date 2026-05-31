import type { JudgeConfig, ScoreConfig } from '@/types/game';

export const BPM = 120;
export const BEAT_INTERVAL = 60000 / BPM;

export const NOTE_SPEED = 400;
export const NOTE_SPEED_MIN = 200;
export const NOTE_SPEED_MAX = 800;
export const NOTE_SPEED_DEFAULT = 400;
export const NOTE_FALL_DURATION = 2000;
export const NOTE_RADIUS = 24;

export const JUDGE_LINE_Y_RATIO = 0.85;

export const JUDGE_CONFIG: JudgeConfig = {
  perfectWindow: 30,
  goodWindow: 80,
};

export const JUDGE_OFFSET_MIN = -100;
export const JUDGE_OFFSET_MAX = 100;
export const JUDGE_OFFSET_DEFAULT = 0;

export const SCORE_CONFIG: ScoreConfig = {
  perfectScore: 100,
  goodScore: 50,
  comboMultiplierThreshold: 10,
  comboMultiplier: 2,
};

export const COLORS = {
  perfect: '#06b6d4',
  good: '#8b5cf6',
  miss: '#ec4899',
  note: '#a855f7',
  judgeLine: '#06b6d4',
  background: '#0a0a1a',
  backgroundGradientFrom: '#0f0f2e',
  backgroundGradientTo: '#1a1a3e',
};

export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 600;
