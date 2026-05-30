import { Park, WalkabilityResult } from '../types';

const METERS_PER_UNIT = 12.5;
const WALK_SPEED = 5000 / 60;

export function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = (x2 - x1) * METERS_PER_UNIT;
  const dy = (y2 - y1) * METERS_PER_UNIT;
  return Math.sqrt(dx * dx + dy * dy);
}

export function calculateWalkTime(distance: number): number {
  return Math.ceil(distance / WALK_SPEED);
}

export function findNearestParks(
  x: number,
  y: number,
  parks: Park[],
  limit: number = 2
): WalkabilityResult[] {
  const results: WalkabilityResult[] = parks.map((park) => {
    const distance = calculateDistance(x, y, park.x, park.y);
    const walkTime = calculateWalkTime(distance);
    return { park, distance, walkTime };
  });

  results.sort((a, b) => a.distance - b.distance);

  return results.slice(0, limit);
}

export function formatArea(area: number): string {
  if (area >= 10000) {
    return `${(area / 10000).toFixed(1)} 公顷`;
  }
  return `${area} 平方米`;
}

export function formatDistance(distance: number): string {
  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(2)} 公里`;
  }
  return `${Math.round(distance)} 米`;
}
