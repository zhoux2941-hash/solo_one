import { PointCharge, CHARGE_RADIUS } from '@/types/physics';

export function drawCharges(
  ctx: CanvasRenderingContext2D,
  charges: PointCharge[]
): void {
  for (const charge of charges) {
    drawCharge(ctx, charge);
  }
}

function drawCharge(ctx: CanvasRenderingContext2D, charge: PointCharge): void {
  const isPositive = charge.charge > 0;
  const color = isPositive ? '#00d4ff' : '#ff4444';
  const radius = CHARGE_RADIUS;

  const gradient = ctx.createRadialGradient(
    charge.x,
    charge.y,
    0,
    charge.x,
    charge.y,
    radius * 2
  );
  gradient.addColorStop(0, isPositive ? 'rgba(0, 212, 255, 0.6)' : 'rgba(255, 68, 68, 0.6)');
  gradient.addColorStop(0.5, isPositive ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255, 68, 68, 0.2)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(charge.x, charge.y, radius * 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(charge.x, charge.y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(charge.x, charge.y, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isPositive ? '+' : '−', charge.x, charge.y);

  ctx.fillStyle = '#fff';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.abs(charge.charge).toFixed(1)}e`, charge.x, charge.y + radius + 12);
}

export function isPointInCharge(
  x: number,
  y: number,
  charge: PointCharge
): boolean {
  const dx = x - charge.x;
  const dy = y - charge.y;
  return dx * dx + dy * dy <= CHARGE_RADIUS * CHARGE_RADIUS;
}

export function findChargeAtPoint(
  x: number,
  y: number,
  charges: PointCharge[]
): PointCharge | null {
  for (let i = charges.length - 1; i >= 0; i--) {
    if (isPointInCharge(x, y, charges[i])) {
      return charges[i];
    }
  }
  return null;
}
