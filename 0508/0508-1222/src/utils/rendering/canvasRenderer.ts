import { PointCharge, Particle, MagneticField, DisplayConfig, Vector2D, ConductorSphere } from '@/types/physics';
import { drawGrid } from './gridRenderer';
import { drawVectorField } from './vectorFieldRenderer';
import { drawFieldLines } from './fieldLineRenderer';
import { drawParticles } from './particleRenderer';
import { drawCharges } from './chargeRenderer';
import { drawConductors, prepareConductorRenderData } from './conductorRenderer';

interface RenderParams {
  charges: PointCharge[];
  particles: Particle[];
  conductors: ConductorSphere[];
  magneticField: MagneticField;
  displayConfig: DisplayConfig;
  vectorFieldData: { x: number; y: number; Ex: number; Ey: number; magnitude: number }[];
  fieldLines: Vector2D[][];
  selectedConductorId: string | null;
}

export function renderCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  params: RenderParams
): void {
  ctx.fillStyle = '#0a0e1a';
  ctx.fillRect(0, 0, width, height);

  if (params.displayConfig.showGrid) {
    drawGrid(ctx, width, height);
  }

  drawMagneticFieldIndicator(ctx, width, height, params.magneticField);

  if (params.displayConfig.showFieldLines && params.fieldLines.length > 0) {
    drawFieldLines(ctx, params.fieldLines);
  }

  if (params.displayConfig.showVectorField && params.vectorFieldData.length > 0) {
    drawVectorField(ctx, params.vectorFieldData);
  }

  if (params.displayConfig.showTrajectories) {
    drawParticles(ctx, params.particles, true);
  } else {
    drawParticles(ctx, params.particles, false);
  }

  drawCharges(ctx, params.charges);

  if (params.conductors.length > 0) {
    const conductorData = prepareConductorRenderData(params.conductors, params.charges);
    drawConductors(ctx, conductorData, params.selectedConductorId);
  }
}

function drawMagneticFieldIndicator(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  magneticField: MagneticField
): void {
  if (magneticField.strength <= 0) return;

  const indicatorSize = 20;
  const spacing = 100;
  const opacity = Math.min(0.4, magneticField.strength / 0.005);

  ctx.fillStyle = `rgba(168, 85, 247, ${opacity})`;

  for (let x = spacing; x < width; x += spacing) {
    for (let y = spacing; y < height; y += spacing) {
      if (magneticField.direction === 'out') {
        drawCircleWithDot(ctx, x, y, indicatorSize / 2);
      } else {
        drawCircleWithCross(ctx, x, y, indicatorSize / 2);
      }
    }
  }
}

function drawCircleWithDot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.beginPath();
  ctx.arc(x, y, r / 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawCircleWithCross(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - r / 2, y - r / 2);
  ctx.lineTo(x + r / 2, y + r / 2);
  ctx.moveTo(x + r / 2, y - r / 2);
  ctx.lineTo(x - r / 2, y + r / 2);
  ctx.stroke();
}
