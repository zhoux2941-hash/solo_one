export type GameStatus = 'idle' | 'playing' | 'throwing' | 'finished';

export type DistanceZone = 'near' | 'middle' | 'far';

export interface ThrowResult {
  success: boolean;
  zone: DistanceZone | null;
  score: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface DistanceConfig {
  zone: DistanceZone;
  minY: number;
  maxY: number;
  score: number;
  label: string;
  color: string;
}

export interface GameState {
  status: GameStatus;
  currentRound: number;
  totalRounds: number;
  currentScore: number;
  throwResults: ThrowResult[];
  highScore: number;
  basketPosition: number;
  basketYPosition: number;
  ballPosition: Position | null;
  isBallFlying: boolean;
  scorePopup: { score: number; position: Position } | null;
}

export interface GameActions {
  startGame: () => void;
  throwBall: () => void;
  resetGame: () => void;
  updateBasketPosition: (pos: number) => void;
  updateBasketYPosition: (pos: number) => void;
  updateBallPosition: (pos: Position | null) => void;
  setScorePopup: (popup: { score: number; position: Position } | null) => void;
}
