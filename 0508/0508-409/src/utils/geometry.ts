import { Point, FoldStep, CANVAS_SIZE, CanvasTransform } from '../types';

export function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function getFoldRegion(step: FoldStep): Point[] {
  const s = CANVAS_SIZE;
  const h = s / 2;
  switch (step) {
    case 0: return [{ x: 0, y: 0 }, { x: s, y: 0 }, { x: s, y: s }, { x: 0, y: s }];
    case 1: return [{ x: h, y: 0 }, { x: s, y: 0 }, { x: s, y: s }, { x: h, y: s }];
    case 2: return [{ x: h, y: h }, { x: s, y: h }, { x: s, y: s }, { x: h, y: s }];
    case 3: return [{ x: h, y: h }, { x: s, y: h }, { x: s, y: s }];
    default: return [];
  }
}

export function getFoldLines(step: FoldStep): { start: Point; end: Point }[] {
  const s = CANVAS_SIZE;
  const h = s / 2;
  const lines: { start: Point; end: Point }[] = [];
  if (step >= 1) lines.push({ start: { x: h, y: 0 }, end: { x: h, y: s } });
  if (step >= 2) lines.push({ start: { x: 0, y: h }, end: { x: s, y: h } });
  if (step >= 3) lines.push({ start: { x: h, y: h }, end: { x: s, y: s } });
  return lines;
}

export function getLocalOrigin(foldStep: FoldStep): Point {
  const h = CANVAS_SIZE / 2;
  switch (foldStep) {
    case 0: return { x: 0, y: 0 };
    case 1: return { x: h, y: 0 };
    case 2: case 3: return { x: h, y: h };
    default: return { x: 0, y: 0 };
  }
}

export function getLocalClipPath(foldStep: FoldStep): Point[] {
  const h = CANVAS_SIZE / 2;
  switch (foldStep) {
    case 0: return [{ x: 0, y: 0 }, { x: CANVAS_SIZE, y: 0 }, { x: CANVAS_SIZE, y: CANVAS_SIZE }, { x: 0, y: CANVAS_SIZE }];
    case 1: return [{ x: 0, y: 0 }, { x: h, y: 0 }, { x: h, y: CANVAS_SIZE }, { x: 0, y: CANVAS_SIZE }];
    case 2: return [{ x: 0, y: 0 }, { x: h, y: 0 }, { x: h, y: h }, { x: 0, y: h }];
    case 3: return [{ x: 0, y: 0 }, { x: h, y: 0 }, { x: h, y: h }];
    default: return [{ x: 0, y: 0 }, { x: CANVAS_SIZE, y: 0 }, { x: CANVAS_SIZE, y: CANVAS_SIZE }, { x: 0, y: CANVAS_SIZE }];
  }
}

export function getSymmetricTransforms(foldStep: FoldStep): CanvasTransform[] {
  const h = CANVAS_SIZE / 2;
  switch (foldStep) {
    case 0:
      return [[1, 0, 0, 1, 0, 0]];
    case 1:
      return [
        [1, 0, 0, 1, h, 0],
        [-1, 0, 0, 1, h, 0],
      ];
    case 2:
      return [
        [1, 0, 0, 1, h, h],
        [-1, 0, 0, 1, h, h],
        [1, 0, 0, -1, h, h],
        [-1, 0, 0, -1, h, h],
      ];
    case 3:
      return [
        [1, 0, 0, 1, h, h],
        [0, 1, 1, 0, h, h],
        [-1, 0, 0, 1, h, h],
        [0, 1, -1, 0, h, h],
        [1, 0, 0, -1, h, h],
        [0, -1, 1, 0, h, h],
        [-1, 0, 0, -1, h, h],
        [0, -1, -1, 0, h, h],
      ];
    default:
      return [[1, 0, 0, 1, 0, 0]];
  }
}

export function getTotalLayers(foldStep: FoldStep): number {
  return Math.pow(2, foldStep);
}

export function globalToLocal(point: Point, foldStep: FoldStep): Point {
  const o = getLocalOrigin(foldStep);
  return { x: point.x - o.x, y: point.y - o.y };
}

export function isPointInRegion(point: Point, region: Point[]): boolean {
  let inside = false;
  const n = region.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = region[i].x, yi = region[i].y;
    const xj = region[j].x, yj = region[j].y;
    if (((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

export function clampPointToRegion(point: Point, region: Point[]): Point {
  if (isPointInRegion(point, region)) return point;
  let minDist = Infinity;
  let closest: Point = point;
  for (let i = 0; i < region.length; i++) {
    const a = region[i];
    const b = region[(i + 1) % region.length];
    const ab = { x: b.x - a.x, y: b.y - a.y };
    const ap = { x: point.x - a.x, y: point.y - a.y };
    const t = Math.max(0, Math.min(1, (ap.x * ab.x + ap.y * ab.y) / (ab.x * ab.x + ab.y * ab.y)));
    const projection = { x: a.x + t * ab.x, y: a.y + t * ab.y };
    const dist = distance(point, projection);
    if (dist < minDist) { minDist = dist; closest = projection; }
  }
  return closest;
}

export function simplifyPath(points: Point[], tolerance: number = 2): Point[] {
  if (points.length <= 2) return points;
  const result: Point[] = [points[0]];
  let lastKept = points[0];
  for (let i = 1; i < points.length - 1; i++) {
    if (distance(lastKept, points[i]) >= tolerance) {
      result.push(points[i]);
      lastKept = points[i];
    }
  }
  result.push(points[points.length - 1]);
  return result;
}
