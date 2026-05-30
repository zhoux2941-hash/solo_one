import { ConductorSphere, PointCharge, InducedCharge } from '@/types/physics';
import { calculateInducedCharges } from '@/utils/physics/conductorInduction';

interface ConductorRenderData {
  conductor: ConductorSphere;
  inducedCharges: InducedCharge[];
}

export function prepareConductorRenderData(
  conductors: ConductorSphere[],
  charges: PointCharge[]
): ConductorRenderData[] {
  return conductors.map((conductor) => ({
    conductor,
    inducedCharges: calculateInducedCharges(conductor, charges, 36),
  }));
}

export function drawConductors(
  ctx: CanvasRenderingContext2D,
  conductorData: ConductorRenderData[],
  selectedConductorId: string | null
): void {
  for (const data of conductorData) {
    drawConductor(ctx, data.conductor, data.inducedCharges, data.conductor.id === selectedConductorId);
  }
}

function drawConductor(
  ctx: CanvasRenderingContext2D,
  conductor: ConductorSphere,
  inducedCharges: InducedCharge[],
  isSelected: boolean
): void {
  const { x, y, radius } = conductor;

  const glowGradient = ctx.createRadialGradient(x, y, radius * 0.5, x, y, radius * 1.5);
  glowGradient.addColorStop(0, 'rgba(100, 180, 255, 0.15)');
  glowGradient.addColorStop(0.5, 'rgba(100, 180, 255, 0.05)');
  glowGradient.addColorStop(1, 'rgba(100, 180, 255, 0)');

  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
  ctx.fill();

  const bodyGradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
  bodyGradient.addColorStop(0, 'rgba(180, 220, 255, 0.9)');
  bodyGradient.addColorStop(0.7, 'rgba(100, 150, 200, 0.7)');
  bodyGradient.addColorStop(1, 'rgba(60, 100, 150, 0.5)');

  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = isSelected ? '#60a5fa' : 'rgba(150, 200, 255, 0.8)';
  ctx.lineWidth = isSelected ? 3 : 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();

  drawInducedCharges(ctx, x, y, radius, inducedCharges);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('导体', x, y);
}

function drawInducedCharges(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  inducedCharges: InducedCharge[]
): void {
  if (inducedCharges.length === 0) return;

  let maxCharge = 0;
  for (const ic of inducedCharges) {
    const absCharge = Math.abs(ic.charge);
    if (absCharge > maxCharge) maxCharge = absCharge;
  }

  if (maxCharge === 0) return;

  for (const ic of inducedCharges) {
    const normalizedCharge = ic.charge / maxCharge;
    const absNormalized = Math.abs(normalizedCharge);

    if (absNormalized < 0.1) continue;

    const dotRadius = 3 + 5 * absNormalized;
    const distance = radius + 4 + dotRadius;
    const dotX = cx + distance * Math.cos(ic.angle);
    const dotY = cy + distance * Math.sin(ic.angle);

    const isPositive = ic.charge > 0;
    const color = isPositive ? '#00d4ff' : '#ff4444';

    const glow = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, dotRadius * 2);
    glow.addColorStop(0, isPositive ? 'rgba(0, 212, 255, 0.6)' : 'rgba(255, 68, 68, 0.6)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(dotX, dotY, dotRadius * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
    ctx.fill();

    if (absNormalized > 0.3) {
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.floor(8 + 4 * absNormalized)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isPositive ? '+' : '−', dotX, dotY);
    }
  }
}
