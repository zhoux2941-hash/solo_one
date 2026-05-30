import { DistanceConfig } from '@/types/game';

export const DISTANCE_ZONES: DistanceConfig[] = [
  { zone: 'near', minY: 60, maxY: 78, score: 5, label: '近区 +5', color: '#2A9D8F' },
  { zone: 'middle', minY: 38, maxY: 60, score: 10, label: '中区 +10', color: '#457B9D' },
  { zone: 'far', minY: 15, maxY: 38, score: 20, label: '远区 +20', color: '#E63946' },
];

export const GAME_CONFIG = {
  totalRounds: 5,
  basketWidth: 100,
  basketHeight: 60,
  ballSize: 36,
  basketSpeed: 0.9,
  ballFlyDuration: {
    far: 1200,
    middle: 950,
    near: 750,
  },
  canvasWidth: 800,
  canvasHeight: 600,
  startBallY: 92,
  basketYPositions: {
    far: 27,
    middle: 49,
    near: 69,
  },
};

export const HIGH_SCORE_KEY = 'zhuang_embroidery_high_score';
