export interface ViewTransform {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export interface Point {
  x: number;
  y: number;
}

export function worldToScreen(worldPoint: Point, transform: ViewTransform): Point {
  return {
    x: worldPoint.x * transform.zoom + transform.offsetX,
    y: worldPoint.y * transform.zoom + transform.offsetY,
  };
}

export function screenToWorld(screenPoint: Point, transform: ViewTransform): Point {
  return {
    x: (screenPoint.x - transform.offsetX) / transform.zoom,
    y: (screenPoint.y - transform.offsetY) / transform.zoom,
  };
}

export function scaleToWorld(scale: number, transform: ViewTransform): number {
  return scale / transform.zoom;
}

export function scaleToScreen(scale: number, transform: ViewTransform): number {
  return scale * transform.zoom;
}

export function clampZoom(zoom: number, minZoom: number, maxZoom: number): number {
  return Math.max(minZoom, Math.min(maxZoom, zoom));
}

export function zoomAroundPoint(
  transform: ViewTransform,
  screenPoint: Point,
  deltaZoom: number,
  minZoom: number,
  maxZoom: number
): ViewTransform {
  const worldPoint = screenToWorld(screenPoint, transform);
  const newZoom = clampZoom(transform.zoom + deltaZoom, minZoom, maxZoom);

  if (newZoom === transform.zoom) {
    return transform;
  }

  const newOffsetX = screenPoint.x - worldPoint.x * newZoom;
  const newOffsetY = screenPoint.y - worldPoint.y * newZoom;

  return {
    zoom: newZoom,
    offsetX: newOffsetX,
    offsetY: newOffsetY,
  };
}

export function panView(transform: ViewTransform, deltaX: number, deltaY: number): ViewTransform {
  return {
    ...transform,
    offsetX: transform.offsetX + deltaX,
    offsetY: transform.offsetY + deltaY,
  };
}

export function resetView(width: number, height: number): ViewTransform {
  return {
    zoom: 1,
    offsetX: width / 2,
    offsetY: height / 2,
  };
}
