export interface Vector2D {
  x: number;
  y: number;
}

export interface PointCharge {
  id: string;
  x: number;
  y: number;
  charge: number;
}

export interface ConductorSphere {
  id: string;
  x: number;
  y: number;
  radius: number;
}

export interface InducedCharge {
  x: number;
  y: number;
  charge: number;
  angle: number;
}

export interface MagneticField {
  strength: number;
  direction: 'into' | 'out';
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  charge: number;
  mass: number;
  trajectory: Vector2D[];
}

export interface TrajectoryPoint {
  x: number;
  y: number;
}

export interface SimulationState {
  running: boolean;
  dt: number;
  time: number;
}

export interface DisplayConfig {
  vectorGridDensity: number;
  fieldLineDensity: number;
  showVectorField: boolean;
  showFieldLines: boolean;
  showTrajectories: boolean;
  showGrid: boolean;
}

export interface ViewTransform {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export type ToolType = 'select' | 'positive' | 'negative' | 'particle' | 'conductor' | 'pan';

export const K = 9e9;
export const MAX_TRAJECTORY_LENGTH = 500;
export const FIELD_LINE_MAX_STEPS = 300;
export const FIELD_LINE_STEP = 2;
export const CHARGE_RADIUS = 15;
export const CONDUCTOR_DEFAULT_RADIUS = 60;
export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 5;
export const DEFAULT_ZOOM = 1;

export function vectorLength(v: Vector2D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function normalizeVector(v: Vector2D): Vector2D {
  const len = vectorLength(v);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function distance(p1: Vector2D, p2: Vector2D): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
  return Math.sqrt(dx * dx + dy * dy);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
