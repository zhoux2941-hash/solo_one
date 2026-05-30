import {
  BOW_POSITION,
  MAX_DRAW_DISTANCE,
  ARROW_SPEED_MULTIPLIER,
  GRAVITY,
  WIND_INFLUENCE,
  Arrow,
  TargetConfig,
} from '@/types/game';

export interface WindForce {
  x: number;
  y: number;
}

export interface LaunchVelocity {
  vx: number;
  vy: number;
  speed: number;
  angle: number;
}

export const calculateWindForce = (
  windDirection: number,
  windSpeed: number
): WindForce => {
  const windRad = (windDirection * Math.PI) / 180;
  return {
    x: Math.cos(windRad) * windSpeed * WIND_INFLUENCE,
    y: Math.sin(windRad) * windSpeed * WIND_INFLUENCE,
  };
};

export const calculateLaunchVelocity = (
  drawDistance: number
): LaunchVelocity => {
  const clampedDistance = Math.min(Math.max(drawDistance, 0), MAX_DRAW_DISTANCE);
  const speed = clampedDistance * ARROW_SPEED_MULTIPLIER;
  const dx = BOW_POSITION.x - (BOW_POSITION.x - clampedDistance);
  const dy = 0;
  const angle = Math.atan2(dy, dx);

  return {
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    speed,
    angle,
  };
};

export const calculateLaunchVelocityFromPosition = (
  currentDrawX: number,
  currentDrawY: number
): LaunchVelocity => {
  const dx = BOW_POSITION.x - currentDrawX;
  const dy = BOW_POSITION.y - currentDrawY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const speed = distance * ARROW_SPEED_MULTIPLIER;
  const angle = Math.atan2(dy, dx);

  return {
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    speed,
    angle,
  };
};

export const updateArrowPhysics = (
  arrow: Arrow,
  windForce: WindForce
): {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: { x: number; y: number }[];
} => {
  const newTrail = [...arrow.trail, { x: arrow.x, y: arrow.y }];
  if (newTrail.length > 20) newTrail.shift();

  const newVx = arrow.vx + windForce.x;
  const newVy = arrow.vy + GRAVITY + windForce.y;
  const newX = arrow.x + newVx;
  const newY = arrow.y + newVy;

  return {
    x: newX,
    y: newY,
    vx: newVx,
    vy: newVy,
    trail: newTrail,
  };
};

export const checkTargetHit = (
  x: number,
  y: number,
  targetConfig: TargetConfig
): boolean => {
  const distance = Math.sqrt(
    Math.pow(x - targetConfig.centerX, 2) +
    Math.pow(y - targetConfig.centerY, 2)
  );
  return distance <= targetConfig.rings[0].radius;
};

export const checkOutOfBounds = (
  x: number,
  y: number,
  maxX: number = 1200,
  maxY: number = 800
): boolean => {
  return x > maxX || y > maxY || y < 0;
};

export const calculateScore = (
  x: number,
  y: number,
  targetConfig: TargetConfig
): number => {
  const distance = Math.sqrt(
    Math.pow(x - targetConfig.centerX, 2) +
    Math.pow(y - targetConfig.centerY, 2)
  );

  for (let i = targetConfig.rings.length - 1; i >= 0; i--) {
    if (distance <= targetConfig.rings[i].radius) {
      return targetConfig.rings[i].score;
    }
  }

  return 0;
};

export const getDrawStrengthPercentage = (drawDistance: number): number => {
  const clampedDistance = Math.min(Math.max(drawDistance, 0), MAX_DRAW_DISTANCE);
  return (clampedDistance / MAX_DRAW_DISTANCE) * 100;
};
