import { gcd } from './gcd';
import type { LissajousParams, Point } from '../types';

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a * b) / gcd(a, b);
}

export function calculatePoint(t: number, params: LissajousParams): Point {
  const { fx, fy, phase, amplitude } = params;
  const phaseRad = degToRad(phase);
  const x = amplitude * Math.sin(2 * Math.PI * fx * t + phaseRad);
  const y = amplitude * Math.sin(2 * Math.PI * fy * t);
  return { x, y, t };
}

export function generatePoints(
  params: LissajousParams,
  numPoints: number = 1000
): Point[] {
  const { fx, fy } = params;
  const period = lcm(fx, fy) / Math.min(fx, fy);
  const points: Point[] = [];

  for (let i = 0; i < numPoints; i++) {
    const t = (i / (numPoints - 1)) * period;
    points.push(calculatePoint(t, params));
  }

  return points;
}
