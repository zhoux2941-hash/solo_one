export type JudgeResult = 'perfect' | 'good' | 'miss' | null;

export interface Note {
  id: string;
  targetTime: number;
  y: number;
  hit: boolean;
  missed: boolean;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  score: number;
  combo: number;
  maxCombo: number;
  notes: Note[];
  particles: Particle[];
  lastJudge: JudgeResult;
  judgeTime: number;
  startTime: number;
  lastNoteTime: number;
  judgeOffset: number;
  noteSpeed: number;
}

export interface JudgeConfig {
  perfectWindow: number;
  goodWindow: number;
}

export interface ScoreConfig {
  perfectScore: number;
  goodScore: number;
  comboMultiplierThreshold: number;
  comboMultiplier: number;
}
