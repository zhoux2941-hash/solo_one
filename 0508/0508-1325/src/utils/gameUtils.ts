import { DISTANCE_ZONES } from '@/config/gameConfig';
import { DistanceZone, Position } from '@/types/game';

export function getDistanceZone(yPercent: number): DistanceZone | null {
  for (const zone of DISTANCE_ZONES) {
    if (yPercent >= zone.minY && yPercent < zone.maxY) {
      return zone.zone;
    }
  }
  return null;
}

export function getScoreByZone(zone: DistanceZone | null): number {
  if (!zone) return 0;
  const config = DISTANCE_ZONES.find(z => z.zone === zone);
  return config ? config.score : 0;
}

export function checkCollision(
  ballPos: Position,
  basketXPercent: number,
  basketWidth: number,
  canvasWidth: number,
  ballSize: number
): boolean {
  const basketX = (basketXPercent / 100) * canvasWidth;
  const basketLeft = basketX - basketWidth / 2;
  const basketRight = basketX + basketWidth / 2;
  
  const ballLeft = ballPos.x - ballSize / 2;
  const ballRight = ballPos.x + ballSize / 2;
  
  const ballCenterX = ballPos.x;
  
  return ballCenterX >= basketLeft && ballCenterX <= basketRight;
}

export function calculateParabolicPath(
  progress: number,
  startY: number,
  targetY: number,
  targetX: number = 50
): Position {
  const startX = 50;
  const peakY = Math.min(startY, targetY) - 15;
  
  const t = progress;
  const mt = 1 - t;
  
  const x = mt * mt * startX + 2 * mt * t * targetX + t * t * targetX;
  const y = mt * mt * startY + 2 * mt * t * peakY + t * t * targetY;
  
  return { x, y };
}

export function getRandomBasketYPosition(): { y: number; zone: 'far' | 'middle' | 'near' } {
  const zones: Array<'far' | 'middle' | 'near'> = ['far', 'middle', 'near'];
  const weights = [0.3, 0.4, 0.3];
  
  const rand = Math.random();
  let cumulative = 0;
  let selectedZone: 'far' | 'middle' | 'near' = 'middle';
  
  for (let i = 0; i < zones.length; i++) {
    cumulative += weights[i];
    if (rand < cumulative) {
      selectedZone = zones[i];
      break;
    }
  }
  
  const positions = {
    far: 25 + Math.random() * 5,
    middle: 45 + Math.random() * 8,
    near: 63 + Math.random() * 10,
  };
  
  return {
    y: positions[selectedZone],
    zone: selectedZone,
  };
}
