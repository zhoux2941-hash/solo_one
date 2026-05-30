import { Vector2D } from '@/types/physics';

export function drawFieldLines(
  ctx: CanvasRenderingContext2D,
  lines: Vector2D[][]
): void {
  for (const line of lines) {
    if (line.length < 2) continue;

    ctx.beginPath();
    ctx.moveTo(line[0].x, line[0].y);

    for (let i = 1; i < line.length; i++) {
      ctx.lineTo(line[i].x, line[i].y);
    }

    const gradient = ctx.createLinearGradient(
      line[0].x,
      line[0].y,
      line[line.length - 1].x,
      line[line.length - 1].y
    );
    gradient.addColorStop(0, 'rgba(0, 212, 255, 0.9)');
    gradient.addColorStop(0.5, 'rgba(0, 180, 255, 0.7)');
    gradient.addColorStop(1, 'rgba(168, 85, 247, 0.5)');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    const arrowInterval = 20;
    for (let i = arrowInterval; i < line.length - 5; i += arrowInterval) {
      const p1 = line[i];
      const p2 = line[i + 3];
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      drawArrowHead(ctx, p1.x, p1.y, angle);
    }
  }
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number
): void {
  const size = 6;
  ctx.fillStyle = 'rgba(0, 212, 255, 0.8)';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(
    x + size * Math.cos(angle + Math.PI * 0.8),
    y + size * Math.sin(angle + Math.PI * 0.8)
  );
  ctx.lineTo(
    x + size * Math.cos(angle + Math.PI * 1.2),
    y + size * Math.sin(angle + Math.PI * 1.2)
  );
  ctx.closePath();
  ctx.fill();
}
