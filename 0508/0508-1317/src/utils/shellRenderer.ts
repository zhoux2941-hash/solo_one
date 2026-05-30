import type { PitShape, CrackBranch, Inscription } from '@/types';

export function drawCACrackPath(
  ctx: CanvasRenderingContext2D,
  path: { x: number; y: number; width: number }[],
  progress: number
): void {
  if (progress <= 0 || path.length < 2) return;

  const effectiveLength = Math.floor(path.length * Math.min(progress, 1));
  if (effectiveLength < 2) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let i = 1; i < effectiveLength; i++) {
    const t = i / path.length;
    const segProgress = i / effectiveLength;
    const lineWidth = Math.max(0.6, path[i].width * (1 - t * 0.5));

    const jitter = (Math.sin(i * 5.7 + path[0].x * 0.1) * 0.5);

    ctx.strokeStyle = `rgba(35, 20, 10, ${0.92 - segProgress * 0.25})`;
    ctx.lineWidth = lineWidth;

    ctx.beginPath();
    ctx.moveTo(path[i - 1].x + jitter * 0.3, path[i - 1].y);
    ctx.lineTo(path[i].x - jitter * 0.3, path[i].y);
    ctx.stroke();

    if (lineWidth > 1.3) {
      ctx.strokeStyle = `rgba(75, 50, 30, ${0.35 - segProgress * 0.2})`;
      ctx.lineWidth = lineWidth * 0.35;
      ctx.beginPath();
      ctx.moveTo(path[i - 1].x + 0.5, path[i - 1].y + 0.3);
      ctx.lineTo(path[i].x + 0.5, path[i].y + 0.3);
      ctx.stroke();
    }
  }

  ctx.restore();
}

export function drawPlastronOutline(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  width: number,
  height: number
): void {
  const hw = width / 2;
  const hh = height / 2;
  const flatRatio = 0.12;

  ctx.save();
  ctx.strokeStyle = '#5c4a3a';
  ctx.lineWidth = 2.5;
  ctx.fillStyle = '#f5e6c8';

  ctx.beginPath();
  ctx.moveTo(centerX, centerY - hh);
  ctx.bezierCurveTo(
    centerX + hw * 0.5, centerY - hh,
    centerX + hw, centerY - hh * (1 - flatRatio),
    centerX + hw, centerY
  );
  ctx.bezierCurveTo(
    centerX + hw, centerY + hh * (1 - flatRatio),
    centerX + hw * 0.5, centerY + hh,
    centerX, centerY + hh
  );
  ctx.bezierCurveTo(
    centerX - hw * 0.5, centerY + hh,
    centerX - hw, centerY + hh * (1 - flatRatio),
    centerX - hw, centerY
  );
  ctx.bezierCurveTo(
    centerX - hw, centerY - hh * (1 - flatRatio),
    centerX - hw * 0.5, centerY - hh,
    centerX, centerY - hh
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = '#8b7355';
  ctx.lineWidth = 1;

  const midY = centerY;
  ctx.beginPath();
  ctx.moveTo(centerX - hw * 0.85, midY);
  ctx.lineTo(centerX + hw * 0.85, midY);
  ctx.stroke();

  for (let i = -1; i <= 1; i += 2) {
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - hh * 0.15);
    ctx.bezierCurveTo(
      centerX + hw * 0.2 * i, centerY - hh * 0.05,
      centerX + hw * 0.3 * i, centerY + hh * 0.15,
      centerX + hw * 0.35 * i, centerY + hh * 0.5
    );
    ctx.stroke();
  }

  for (let i = -1; i <= 1; i += 2) {
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + hh * 0.5);
    ctx.bezierCurveTo(
      centerX + hw * 0.25 * i, centerY + hh * 0.6,
      centerX + hw * 0.3 * i, centerY + hh * 0.75,
      centerX + hw * 0.2 * i, centerY + hh * 0.9
    );
    ctx.stroke();
  }

  ctx.restore();
}

export function drawCarapaceOutline(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  width: number,
  height: number
): void {
  const hw = width / 2;
  const hh = height / 2;

  ctx.save();
  ctx.strokeStyle = '#5c4a3a';
  ctx.lineWidth = 2.5;
  ctx.fillStyle = '#e8d5a8';

  ctx.beginPath();
  ctx.ellipse(centerX, centerY, hw, hh, 0, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = '#8b7355';
  ctx.lineWidth = 1;

  const hexRadius = Math.min(hw, hh) * 0.35;
  const vertebraeCount = 5;
  for (let row = -1; row <= 1; row++) {
    const cy = centerY + row * hexRadius * 1.1;
    for (let col = -1; col <= 1; col++) {
      const cx = centerX + col * hexRadius * 1.3;
      if (row % 2 !== 0) {
        drawHexagon(ctx, cx, cy, hexRadius * 0.55);
      } else {
        drawHexagon(ctx, cx + hexRadius * 0.65, cy, hexRadius * 0.55);
      }
    }
  }

  for (let i = 0; i < vertebraeCount; i++) {
    const y = centerY - hh * 0.6 + (i / (vertebraeCount - 1)) * hh * 1.2;
    ctx.beginPath();
    ctx.moveTo(centerX, y);
    ctx.lineTo(centerX, y + hh * 0.15);
    ctx.stroke();
  }

  ctx.restore();
}

function drawHexagon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number
): void {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  ctx.stroke();
}

export function drawPitMark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  shape: PitShape
): void {
  ctx.save();
  ctx.fillStyle = '#3a2a1a';
  ctx.strokeStyle = '#2a1a0a';
  ctx.lineWidth = 1;

  if (shape === 'circle') {
    const radius = 4;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    const length = 8;
    const width = 3;
    ctx.beginPath();
    ctx.ellipse(x, y, length, width, Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

export function drawCrackBranch(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  branch: CrackBranch,
  progress: number
): void {
  if (progress <= 0) return;

  const effectiveLength = branch.length * Math.min(progress, 1);
  const segments = Math.max(8, Math.floor(effectiveLength / 3));
  const points: { x: number; y: number }[] = [];

  let currentX = startX;
  let currentY = startY;
  let currentAngle = branch.angle;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    if (t > progress) break;

    points.push({ x: currentX, y: currentY });

    const curvatureEffect = branch.curvature * t;
    const jitter = (Math.sin(i * 7.3 + branch.angle * 3) * 0.08);
    currentAngle = branch.angle + curvatureEffect + jitter;

    const step = effectiveLength / segments;
    currentX += Math.cos(currentAngle) * step;
    currentY += Math.sin(currentAngle) * step;
  }

  if (points.length < 2) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let i = 1; i < points.length; i++) {
    const t = i / points.length;
    const lineWidth = branch.width * (1 - t * 0.7);

    ctx.strokeStyle = `rgba(40, 25, 15, ${0.9 - t * 0.3})`;
    ctx.lineWidth = Math.max(0.5, lineWidth);

    ctx.beginPath();
    ctx.moveTo(points[i - 1].x, points[i - 1].y);
    ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();

    if (lineWidth > 1.2) {
      ctx.strokeStyle = `rgba(80, 55, 35, ${0.4 - t * 0.2})`;
      ctx.lineWidth = lineWidth * 0.4;
      ctx.beginPath();
      ctx.moveTo(
        points[i - 1].x + Math.cos(currentAngle + Math.PI / 2) * lineWidth * 0.3,
        points[i - 1].y + Math.sin(currentAngle + Math.PI / 2) * lineWidth * 0.3
      );
      ctx.lineTo(
        points[i].x + Math.cos(currentAngle + Math.PI / 2) * lineWidth * 0.3,
        points[i].y + Math.sin(currentAngle + Math.PI / 2) * lineWidth * 0.3
      );
      ctx.stroke();
    }
  }

  ctx.restore();

  if (progress > 0.3) {
    const branchProgress = (progress - 0.3) / 0.7;
    for (const sub of branch.subBranches) {
      const branchStartIdx = Math.floor(points.length * 0.4);
      const branchStart = points[Math.min(branchStartIdx, points.length - 1)];
      drawCrackBranch(ctx, branchStart.x, branchStart.y, sub, branchProgress);
    }
  }
}

export function drawInscription(
  ctx: CanvasRenderingContext2D,
  inscription: Inscription
): void {
  ctx.save();

  ctx.translate(inscription.x, inscription.y);
  ctx.rotate((inscription.rotation * Math.PI) / 180);

  ctx.font = `bold ${inscription.fontSize}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = 'rgba(30, 15, 5, 0.85)';
  ctx.fillText(inscription.text, 0, 0);

  ctx.strokeStyle = 'rgba(60, 40, 20, 0.3)';
  ctx.lineWidth = 0.5;
  ctx.strokeText(inscription.text, 0, 0);

  ctx.restore();
}

export function drawBurnMark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  intensity: number
): void {
  const maxRadius = 15 + intensity * 15;
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, maxRadius);

  gradient.addColorStop(0, `rgba(60, 30, 10, ${0.3 + intensity * 0.3})`);
  gradient.addColorStop(0.3, `rgba(100, 50, 20, ${0.2 + intensity * 0.2})`);
  gradient.addColorStop(0.6, `rgba(120, 70, 30, ${0.1 + intensity * 0.1})`);
  gradient.addColorStop(1, 'rgba(150, 100, 50, 0)');

  ctx.save();
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, maxRadius, 0, Math.PI * 2);
  ctx.fill();

  const innerGradient = ctx.createRadialGradient(x, y, 0, x, y, maxRadius * 0.3);
  innerGradient.addColorStop(0, `rgba(20, 10, 0, ${0.5 + intensity * 0.3})`);
  innerGradient.addColorStop(1, 'rgba(60, 30, 10, 0)');
  ctx.fillStyle = innerGradient;
  ctx.beginPath();
  ctx.arc(x, y, maxRadius * 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
