export type GamePhase = 'idle' | 'waiting' | 'pressing' | 'airborne' | 'landing' | 'scoring' | 'aiTurn' | 'gameOver';

export type Pose = 'standing' | 'split' | 'jump' | 'twist' | 'layout' | 'pike';

export type DirectionKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';

export interface Player {
  id: 'player' | 'ai';
  x: number;
  y: number;
  velocityY: number;
  pose: Pose;
  rotation: number;
  isAirborne: boolean;
  currentHeight: number;
  maxHeight: number;
  poseChanges: Pose[];
  landingPose: Pose | null;
}

export interface RoundScore {
  round: number;
  player: 'player' | 'ai';
  poseScore: number;
  heightScore: number;
  landingScore: number;
  total: number;
  timestamp: number;
  timingAccuracy: number;
}

export interface GameState {
  phase: GamePhase;
  currentTurn: 'player' | 'ai';
  round: number;
  pressStartTime: number;
  pressDuration: number;
  perfectWindow: { start: number; end: number };
  timingAccuracy: number;
  player: Player;
  ai: Player;
  boardAngle: number;
  boardShake: number;
  scores: RoundScore[];
  lastScore: RoundScore | null;
  airborneStartTime: number;
  message: string;
  flashEffect: number;
}

export interface InputState {
  spacePressed: boolean;
  spaceReleased: boolean;
  arrowKeys: Record<DirectionKey, boolean>;
  lastPoseChange: number;
}

export const POSE_MAP: Record<DirectionKey, Pose> = {
  ArrowUp: 'layout',
  ArrowDown: 'pike',
  ArrowLeft: 'split',
  ArrowRight: 'twist',
};

export const POSE_NAMES: Record<Pose, string> = {
  standing: '站立',
  split: '劈腿',
  jump: '跳跃',
  twist: '转体',
  layout: '展体',
  pike: '屈体',
};

export const POSE_SCORE_VALUES: Record<Pose, number> = {
  standing: 5,
  split: 15,
  jump: 10,
  twist: 18,
  layout: 20,
  pike: 12,
};
