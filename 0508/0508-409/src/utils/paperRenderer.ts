import { Point, DrawPath, FoldStep, CANVAS_SIZE, CanvasTransform } from '../types';
import { getFoldRegion, getFoldLines, getLocalOrigin, getLocalClipPath, getSymmetricTransforms } from './geometry';

function drawSmoothPath(ctx: CanvasRenderingContext2D, points: Point[]): void {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y);
  } else {
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  }
  ctx.stroke();
}

function clipToPath(ctx: CanvasRenderingContext2D, path: Point[]): void {
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
  ctx.closePath();
  ctx.clip();
}

function applyTransform(ctx: CanvasRenderingContext2D, t: CanvasTransform): void {
  ctx.transform(t[0], t[1], t[2], t[3], t[4], t[5]);
}

export function drawPaperBackground(ctx: CanvasRenderingContext2D): void {
  const gradient = ctx.createRadialGradient(
    CANVAS_SIZE / 2, CANVAS_SIZE / 2, 0,
    CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2
  );
  gradient.addColorStop(0, '#F8F4EA');
  gradient.addColorStop(0.7, '#F5F0E6');
  gradient.addColorStop(1, '#E8E0D0');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  ctx.save();
  ctx.globalAlpha = 0.03;
  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#D4AF37' : '#8B4513';
    ctx.beginPath();
    ctx.arc(
      ((i * 137.5) % CANVAS_SIZE),
      ((i * 97.3) % CANVAS_SIZE),
      (i % 3) + 0.5, 0, Math.PI * 2
    );
    ctx.fill();
  }
  ctx.restore();

  ctx.strokeStyle = 'rgba(61, 41, 20, 0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, CANVAS_SIZE - 1, CANVAS_SIZE - 1);
}

export function drawFoldRegion(ctx: CanvasRenderingContext2D, step: FoldStep, showHidden: boolean = false): void {
  const region = getFoldRegion(step);
  if (region.length < 3) return;

  if (showHidden) {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#E8E0D0';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.restore();
  }

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(region[0].x, region[0].y);
  for (let i = 1; i < region.length; i++) ctx.lineTo(region[i].x, region[i].y);
  ctx.closePath();

  const gradient = ctx.createLinearGradient(
    region[0].x, region[0].y,
    region[region.length - 1].x, region[region.length - 1].y
  );
  gradient.addColorStop(0, '#F8F4EA');
  gradient.addColorStop(1, '#F0E8D8');
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.shadowColor = 'rgba(61, 41, 20, 0.15)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.strokeStyle = 'rgba(61, 41, 20, 0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

export function drawFoldLines(ctx: CanvasRenderingContext2D, step: FoldStep): void {
  const lines = getFoldLines(step);
  ctx.save();
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 4]);
  ctx.lineCap = 'round';
  lines.forEach((line) => {
    ctx.beginPath();
    ctx.moveTo(line.start.x, line.start.y);
    ctx.lineTo(line.end.x, line.end.y);
    ctx.stroke();
  });
  ctx.setLineDash([]);
  lines.forEach((line) => {
    ctx.fillStyle = '#D4AF37';
    ctx.beginPath();
    ctx.arc((line.start.x + line.end.x) / 2, (line.start.y + line.end.y) / 2, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

export function drawSymmetricPaths(
  ctx: CanvasRenderingContext2D,
  paths: DrawPath[],
  foldStep: FoldStep,
  maxLayers?: number
): void {
  const transforms = getSymmetricTransforms(foldStep);
  const count = maxLayers ?? transforms.length;

  for (const path of paths) {
    if (path.points.length < 2) continue;
    ctx.save();
    ctx.strokeStyle = path.color;
    ctx.lineWidth = path.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (path.color === '#1A1A1A') {
      ctx.shadowColor = 'rgba(26, 26, 26, 0.3)';
      ctx.shadowBlur = 2;
    }
    for (let i = 0; i < count; i++) {
      ctx.save();
      applyTransform(ctx, transforms[i]);
      drawSmoothPath(ctx, path.points);
      ctx.restore();
    }
    ctx.restore();
  }
}

export function drawSymmetricCurrentPath(
  ctx: CanvasRenderingContext2D,
  localPoints: Point[],
  color: string,
  lineWidth: number,
  foldStep: FoldStep,
  maxLayers?: number
): void {
  if (localPoints.length < 2) return;
  const transforms = getSymmetricTransforms(foldStep);
  const count = maxLayers ?? transforms.length;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = 0.8;
  if (color === '#1A1A1A') {
    ctx.shadowColor = 'rgba(26, 26, 26, 0.3)';
    ctx.shadowBlur = 2;
  }
  for (let i = 0; i < count; i++) {
    ctx.save();
    applyTransform(ctx, transforms[i]);
    drawSmoothPath(ctx, localPoints);
    ctx.restore();
  }
  ctx.restore();
}

export function drawLocalPath(ctx: CanvasRenderingContext2D, path: DrawPath): void {
  if (path.points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = path.color;
  ctx.lineWidth = path.lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  drawSmoothPath(ctx, path.points);
  ctx.restore();
}

export function drawLocalCurrentPath(
  ctx: CanvasRenderingContext2D,
  localPoints: Point[],
  color: string,
  lineWidth: number
): void {
  if (localPoints.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = 0.8;
  drawSmoothPath(ctx, localPoints);
  ctx.restore();
}

export function drawUnfoldAnimation(
  ctx: CanvasRenderingContext2D,
  paths: DrawPath[],
  currentPath: DrawPath | null,
  unfoldProgress: number
): void {
  const transforms = getSymmetricTransforms(3);
  const visibleLayers = Math.ceil(unfoldProgress * transforms.length);

  drawPaperBackground(ctx);
  drawFoldRegion(ctx, 0);

  drawSymmetricPaths(ctx, paths, 3, visibleLayers);

  if (currentPath && currentPath.points.length >= 2) {
    drawSymmetricCurrentPath(
      ctx, currentPath.points, currentPath.color,
      currentPath.lineWidth, 3, visibleLayers
    );
  }

  if (unfoldProgress < 1) {
    ctx.save();
    ctx.globalAlpha = 0.3 * (1 - unfoldProgress);
    const step = unfoldProgress < 0.33 ? 3 : unfoldProgress < 0.66 ? 2 : unfoldProgress < 0.9 ? 1 : 0;
    if (step > 0) drawFoldLines(ctx, step as FoldStep);
    ctx.restore();
  }
}

export function renderFullScene(
  ctx: CanvasRenderingContext2D,
  foldStep: FoldStep,
  drawPaths: DrawPath[],
  currentPath: DrawPath | null,
  isUnfolding: boolean,
  unfoldProgress: number,
  showFinalResult: boolean
): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  if (isUnfolding) {
    drawUnfoldAnimation(ctx, drawPaths, currentPath, unfoldProgress);
    return;
  }

  if (showFinalResult) {
    drawPaperBackground(ctx);
    drawFoldRegion(ctx, 0);
    drawSymmetricPaths(ctx, drawPaths, 3);
    return;
  }

  drawPaperBackground(ctx);

  if (foldStep >= 3 && drawPaths.length > 0) {
    drawFoldRegion(ctx, 0);

    ctx.save();
    ctx.globalAlpha = 0.25;
    drawSymmetricPaths(ctx, drawPaths, foldStep);
    if (currentPath && currentPath.points.length >= 2) {
      drawSymmetricCurrentPath(ctx, currentPath.points, currentPath.color, currentPath.lineWidth, foldStep);
    }
    ctx.restore();

    const region = getFoldRegion(foldStep);
    const origin = getLocalOrigin(foldStep);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(region[0].x, region[0].y);
    for (let i = 1; i < region.length; i++) ctx.lineTo(region[i].x, region[i].y);
    ctx.closePath();
    ctx.clip();

    drawFoldRegion(ctx, foldStep);
    drawFoldLines(ctx, foldStep);

    ctx.translate(origin.x, origin.y);
    const localClip = getLocalClipPath(foldStep);
    ctx.save();
    clipToPath(ctx, localClip);
    for (const path of drawPaths) drawLocalPath(ctx, path);
    if (currentPath && currentPath.points.length >= 2) {
      drawLocalCurrentPath(ctx, currentPath.points, currentPath.color, currentPath.lineWidth);
    }
    ctx.restore();

    ctx.restore();
  } else {
    drawFoldRegion(ctx, foldStep, true);
    drawFoldLines(ctx, foldStep);
  }
}
