import type { LayerElement, MainRoute, KeyPoint, CollisionResult } from '../../shared/types';

function rectsOverlap(
  r1: { x: number; y: number; width: number; height: number },
  r2: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    r1.x < r2.x + r2.width &&
    r1.x + r1.width > r2.x &&
    r1.y < r2.y + r2.height &&
    r1.y + r1.height > r2.y
  );
}

function getOverlapArea(
  r1: { x: number; y: number; width: number; height: number },
  r2: { x: number; y: number; width: number; height: number }
): number {
  const xOverlap = Math.max(0, Math.min(r1.x + r1.width, r2.x + r2.width) - Math.max(r1.x, r2.x));
  const yOverlap = Math.max(0, Math.min(r1.y + r1.height, r2.y + r2.height) - Math.max(r1.y, r2.y));
  return xOverlap * yOverlap;
}

function pointToSegmentDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  }

  let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  const projX = x1 + t * dx;
  const projY = y1 + t * dy;

  return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
}

function segmentIntersectsRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  const left = rect.x;
  const right = rect.x + rect.width;
  const top = rect.y;
  const bottom = rect.y + rect.height;

  if (x1 >= left && x1 <= right && y1 >= top && y1 <= bottom) return true;
  if (x2 >= left && x2 <= right && y2 >= top && y2 <= bottom) return true;

  const edges = [
    [left, top, right, top],
    [right, top, right, bottom],
    [right, bottom, left, bottom],
    [left, bottom, left, top],
  ];

  for (const [ex1, ey1, ex2, ey2] of edges) {
    const denom = (y2 - y1) * (ex2 - ex1) - (x2 - x1) * (ey2 - ey1);
    if (Math.abs(denom) < 0.0001) continue;

    const ua = ((x2 - x1) * (ey1 - y1) - (y2 - y1) * (ex1 - x1)) / denom;
    const ub = ((ex2 - ex1) * (ey1 - y1) - (ey2 - ey1) * (ex1 - x1)) / denom;

    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      return true;
    }
  }

  return false;
}

function rectIntersectsRoute(
  rect: { x: number; y: number; width: number; height: number },
  route: MainRoute
): { intersects: boolean; minDistance: number; overlapLength: number } {
  const halfWidth = route.width / 2;
  let minDistance = Infinity;
  let totalOverlap = 0;

  const samplePoints: { x: number; y: number }[] = [];
  const step = 5;

  for (let sx = 0; sx <= rect.width; sx += step) {
    for (let sy = 0; sy <= rect.height; sy += step) {
      samplePoints.push({ x: rect.x + sx, y: rect.y + sy });
    }
  }

  for (let i = 0; i < route.points.length - 1; i++) {
    const p1 = route.points[i];
    const p2 = route.points[i + 1];

    const expandedRect = {
      x: rect.x - halfWidth,
      y: rect.y - halfWidth,
      width: rect.width + halfWidth * 2,
      height: rect.height + halfWidth * 2,
    };

    if (segmentIntersectsRect(p1.x, p1.y, p2.x, p2.y, expandedRect)) {
      for (const point of samplePoints) {
        const dist = pointToSegmentDistance(point.x, point.y, p1.x, p1.y, p2.x, p2.y);
        minDistance = Math.min(minDistance, dist);
        if (dist <= halfWidth) {
          totalOverlap += step * step * (1 - dist / halfWidth);
        }
      }
    }
  }

  return {
    intersects: minDistance <= halfWidth,
    minDistance,
    overlapLength: totalOverlap,
  };
}

function rectIntersectsKeyPoint(
  rect: { x: number; y: number; width: number; height: number },
  point: KeyPoint
): { intersects: boolean; overlapArea: number } {
  const closestX = Math.max(rect.x, Math.min(point.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(point.y, rect.y + rect.height));
  const distance = Math.sqrt((point.x - closestX) ** 2 + (point.y - closestY) ** 2);

  let overlapArea = 0;
  if (distance < point.radius) {
    const d = distance;
    const r = point.radius;
    if (d === 0) {
      overlapArea = Math.PI * r * r;
    } else {
      overlapArea = r * r * Math.acos(d / r) - d * Math.sqrt(r * r - d * d);
      overlapArea = Math.min(overlapArea * 2, rect.width * rect.height);
    }
  }

  return {
    intersects: distance <= point.radius,
    overlapArea,
  };
}

function calculateRouteOverlapArea(
  rect: { x: number; y: number; width: number; height: number },
  route: MainRoute
): number {
  const result = rectIntersectsRoute(rect, route);
  return result.overlapLength;
}

export function detectCollisions(
  elements: LayerElement[],
  mainRoutes: MainRoute[],
  keyPoints: KeyPoint[]
): CollisionResult[] {
  const collisions: CollisionResult[] = [];
  const visibleElements = elements.filter((e) => e.visible);
  const processedPairs = new Set<string>();

  for (const element of visibleElements) {
    const elementRect = {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
    };

    for (const route of mainRoutes) {
      const routeResult = rectIntersectsRoute(elementRect, route);
      if (routeResult.intersects) {
        const overlapArea = calculateRouteOverlapArea(elementRect, route);
        const rectArea = element.width * element.height;
        const overlapPercent = overlapArea / rectArea;

        collisions.push({
          elementId: element.id,
          elementText: element.text,
          collisionType: 'main_route',
          severity: overlapPercent > 0.3 || overlapArea > 500 ? 'danger' : 'warning',
          message: `「${element.text}」遮挡了主航线「${route.name}」(${Math.round(overlapPercent * 100)}%)`,
          overlapArea,
        });
      }
    }

    for (const point of keyPoints) {
      const pointResult = rectIntersectsKeyPoint(elementRect, point);
      if (pointResult.intersects) {
        collisions.push({
          elementId: element.id,
          elementText: element.text,
          collisionType: 'key_point',
          severity: 'danger',
          message: `「${element.text}」遮挡了关键点「${point.name}」`,
          overlapArea: pointResult.overlapArea,
        });
      }
    }

    for (const otherElement of visibleElements) {
      if (element.id === otherElement.id) continue;

      const pairKey = [element.id, otherElement.id].sort().join('-');
      if (processedPairs.has(pairKey)) continue;
      processedPairs.add(pairKey);

      const otherRect = {
        x: otherElement.x,
        y: otherElement.y,
        width: otherElement.width,
        height: otherElement.height,
      };

      if (rectsOverlap(elementRect, otherRect)) {
        const overlapArea = getOverlapArea(elementRect, otherRect);
        if (overlapArea > 50) {
          collisions.push({
            elementId: element.id,
            elementText: element.text,
            collisionType: 'other_element',
            severity: overlapArea > 300 ? 'danger' : 'warning',
            message: `「${element.text}」与「${otherElement.text}」重叠(${Math.round(overlapArea)}px²)`,
            overlapArea,
          });

          collisions.push({
            elementId: otherElement.id,
            elementText: otherElement.text,
            collisionType: 'other_element',
            severity: overlapArea > 300 ? 'danger' : 'warning',
            message: `「${otherElement.text}」与「${element.text}」重叠(${Math.round(overlapArea)}px²)`,
            overlapArea,
          });
        }
      }
    }
  }

  return collisions;
}
