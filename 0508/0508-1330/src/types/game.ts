export interface Ring {
  color: string;
  radius: number;
  score: number;
  name: string;
}

export interface TargetConfig {
  centerX: number;
  centerY: number;
  rings: Ring[];
}

export interface Arrow {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
  score: number;
  hitPosition: { x: number; y: number } | null;
  trail: { x: number; y: number }[];
}

export interface GameState {
  currentRound: number;
  arrowsRemaining: number;
  scores: number[];
  totalScore: number;
  isDrawing: boolean;
  drawStrength: number;
  drawStartX: number;
  drawStartY: number;
  currentDrawX: number;
  currentDrawY: number;
  arrows: Arrow[];
  windDirection: number;
  windSpeed: number;
  targetConfig: TargetConfig;
  gameOver: boolean;
}

export interface GameActions {
  startDrawing: (x: number, y: number) => void;
  updateDrawing: (x: number, y: number) => void;
  releaseArrow: () => void;
  updateArrowPositions: () => void;
  resetGame: () => void;
  generateWind: () => void;
  calculateScore: (x: number, y: number) => number;
}

export const TARGET_RINGS: Ring[] = [
  { color: '#FFFFFF', radius: 200, score: 2, name: '白环' },
  { color: '#22C55E', radius: 160, score: 4, name: '绿环' },
  { color: '#3B82F6', radius: 120, score: 6, name: '蓝环' },
  { color: '#EAB308', radius: 80, score: 8, name: '黄环' },
  { color: '#EF4444', radius: 40, score: 10, name: '红心' },
];

export const BOW_POSITION = { x: 150, y: 400 };
export const MAX_DRAW_DISTANCE = 150;
export const ARROW_SPEED_MULTIPLIER = 0.5;
export const GRAVITY = 0.12;
export const WIND_INFLUENCE = 0.015;
