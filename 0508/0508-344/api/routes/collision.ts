import { Router, Request, Response } from 'express';
import type { CollisionCheckRequest, CollisionCheckResponse, LayerElement, MainRoute, KeyPoint, CollisionResult } from '../../shared/types';

const router = Router();

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

function rectIntersectsRoute(
  rect: { x: number; y: number; width: number; height: number },
  route: MainRoute
): boolean {
  const halfWidth = route.width / 2;
  const rectCorners = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x, y: rect.y + rect.height },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
  ];

  for (let i = 0; i < route.points.length - 1; i++) {
    const p1 = route.points[i];
    const p2 = route.points[i + 1];

    for (const corner of rectCorners) {
      const dist = pointToSegmentDistance(corner.x, corner.y, p1.x, p1.y, p2.x, p2.y);
      if (dist <= halfWidth) {
        return true;
      }
    }
  }

  return false;
}

function rectIntersectsKeyPoint(
  rect: { x: number; y: number; width: number; height: number },
  point: KeyPoint
): boolean {
  const closestX = Math.max(rect.x, Math.min(point.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(point.y, rect.y + rect.height));
  const distance = Math.sqrt((point.x - closestX) ** 2 + (point.y - closestY) ** 2);
  return distance <= point.radius;
}

function getRouteOverlapArea(
  rect: { x: number; y: number; width: number; height: number },
  route: MainRoute
): number {
  const rectArea = rect.width * rect.height;
  let coverage = 0;

  for (let i = 0; i < route.points.length - 1; i++) {
    const p1 = route.points[i];
    const p2 = route.points[i + 1];

    const center = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    const dist = pointToSegmentDistance(center.x, center.y, p1.x, p1.y, p2.x, p2.y);
    if (dist <= route.width / 2) {
      coverage = Math.max(coverage, 1 - dist / (route.width / 2));
    }
  }

  return rectArea * coverage * 0.5;
}

function detectCollisions(
  elements: LayerElement[],
  mainRoutes: MainRoute[],
  keyPoints: KeyPoint[]
): CollisionResult[] {
  const collisions: CollisionResult[] = [];
  const visibleElements = elements.filter((e) => e.visible);

  for (const element of visibleElements) {
    const elementRect = {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
    };

    for (const route of mainRoutes) {
      if (rectIntersectsRoute(elementRect, route)) {
        const overlapArea = getRouteOverlapArea(elementRect, route);
        collisions.push({
          elementId: element.id,
          elementText: element.text,
          collisionType: 'main_route',
          severity: overlapArea > 500 ? 'danger' : 'warning',
          message: `注记遮挡了主航线「${route.name}」`,
          overlapArea,
        });
      }
    }

    for (const point of keyPoints) {
      if (rectIntersectsKeyPoint(elementRect, point)) {
        collisions.push({
          elementId: element.id,
          elementText: element.text,
          collisionType: 'key_point',
          severity: 'danger',
          message: `注记遮挡了关键点「${point.name}」`,
          overlapArea: Math.PI * point.radius * point.radius * 0.5,
        });
      }
    }

    for (const otherElement of visibleElements) {
      if (element.id === otherElement.id) continue;

      const otherRect = {
        x: otherElement.x,
        y: otherElement.y,
        width: otherElement.width,
        height: otherElement.height,
      };

      if (rectsOverlap(elementRect, otherRect)) {
        const overlapArea = getOverlapArea(elementRect, otherRect);
        if (overlapArea > 100) {
          const existingCollision = collisions.find(
            (c) =>
              (c.elementId === element.id && c.collisionType === 'other_element') ||
              (c.elementId === otherElement.id && c.collisionType === 'other_element')
          );

          if (!existingCollision) {
            collisions.push({
              elementId: element.id,
              elementText: element.text,
              collisionType: 'other_element',
              severity: overlapArea > 500 ? 'danger' : 'warning',
              message: `与「${otherElement.text}」发生重叠`,
              overlapArea,
            });
          }
        }
      }
    }
  }

  return collisions;
}

router.post('/check', (req: Request<unknown, unknown, CollisionCheckRequest>, res: Response<CollisionCheckResponse>) => {
  const startTime = Date.now();
  const { elements, mainRoutes, keyPoints } = req.body;

  if (!elements || !mainRoutes || !keyPoints) {
    return res.status(400).json({
      success: false,
      collisions: [],
      checkTime: 0,
    } as CollisionCheckResponse);
  }

  const collisions = detectCollisions(elements, mainRoutes, keyPoints);
  const checkTime = Date.now() - startTime;

  res.json({
    success: true,
    collisions,
    checkTime,
  });
});

export default router;
