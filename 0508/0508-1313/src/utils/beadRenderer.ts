import type { BeadColumn, AbacusType, DraggingBead } from '../types';
import { COLORS, BEAD_RADIUS, BEAD_SPACING, COLUMN_SPACING, BEAM_Y, BEAM_HEIGHT, FRAME_PADDING, ABACUS_CONFIG, UPPER_AREA_HEIGHT, LOWER_AREA_HEIGHT } from './constants';

export interface RenderOptions {
  width: number;
  height: number;
  draggingBead: DraggingBead | null;
  highlightedColumn?: number | null;
  animationProgress?: Map<string, number>;
}

export const drawAbacus = (
  ctx: CanvasRenderingContext2D,
  beads: BeadColumn[],
  type: AbacusType,
  options: RenderOptions
) => {
  const { width, height, draggingBead, highlightedColumn, animationProgress } = options;
  const config = ABACUS_CONFIG[type];

  ctx.clearRect(0, 0, width, height);

  drawBackground(ctx, width, height);
  drawFrame(ctx, width, height);
  drawBeam(ctx, width);
  drawRods(ctx, beads, width, height);

  const totalWidth = (beads.length - 1) * COLUMN_SPACING;
  const startX = (width - totalWidth) / 2;

  for (let colIdx = 0; colIdx < beads.length; colIdx++) {
    const column = beads[colIdx];
    const x = startX + colIdx * COLUMN_SPACING;
    const isHighlighted = highlightedColumn === colIdx;

    for (let j = config.upperBeads - 1; j >= 0; j--) {
      const isDragging = draggingBead &&
        draggingBead.columnIndex === colIdx &&
        draggingBead.beadType === 'upper' &&
        draggingBead.beadIndex === j;

      let position = column.upper[j];
      const animKey = `upper-${colIdx}-${j}`;
      if (animationProgress?.has(animKey)) {
        position = animationProgress.get(animKey)!;
      }

      let y;
      if (isDragging && draggingBead) {
        y = draggingBead.currentY;
      } else {
        const baseY = BEAM_Y - UPPER_AREA_HEIGHT / 2 + BEAD_RADIUS;
        const targetY = BEAM_Y - BEAM_HEIGHT / 2 - BEAD_RADIUS - 5;
        y = position === 1 ? targetY : baseY + j * BEAD_SPACING;
      }

      drawBead(ctx, x, y, 'upper', position === 1, isHighlighted || isDragging);
    }

    for (let j = 0; j < config.lowerBeads; j++) {
      const isDragging = draggingBead &&
        draggingBead.columnIndex === colIdx &&
        draggingBead.beadType === 'lower' &&
        draggingBead.beadIndex === j;

      let position = column.lower[j];
      const animKey = `lower-${colIdx}-${j}`;
      if (animationProgress?.has(animKey)) {
        position = animationProgress.get(animKey)!;
      }

      let y;
      if (isDragging && draggingBead) {
        y = draggingBead.currentY;
      } else {
        const baseY = BEAM_Y + BEAM_HEIGHT / 2 + BEAD_RADIUS + 5;
        const targetY = baseY + (config.lowerBeads - 1) * BEAD_SPACING;
        y = position === 1 ? baseY + j * BEAD_SPACING : targetY - (config.lowerBeads - 1 - j) * BEAD_SPACING;
      }

      drawBead(ctx, x, y, 'lower', position === 1, isHighlighted || isDragging);
    }

    drawColumnLabel(ctx, x, height - 15, colIdx, beads.length, column.columnValue);
  }
};

const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.7);
  gradient.addColorStop(0, '#4A2C1A');
  gradient.addColorStop(1, COLORS.background);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.globalAlpha = 0.03;
  for (let i = 0; i < 50; i++) {
    ctx.fillStyle = '#000';
    ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
  }
  ctx.globalAlpha = 1;
};

const drawFrame = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const frameWidth = width - FRAME_PADDING * 2;
  const frameHeight = height - FRAME_PADDING * 2;
  const x = FRAME_PADDING;
  const y = FRAME_PADDING;

  ctx.fillStyle = COLORS.frameDark;
  ctx.fillRect(x - 4, y - 4, frameWidth + 8, frameHeight + 8);

  const frameGradient = ctx.createLinearGradient(x, y, x, y + frameHeight);
  frameGradient.addColorStop(0, COLORS.frameLight);
  frameGradient.addColorStop(0.3, COLORS.frame);
  frameGradient.addColorStop(0.7, COLORS.frame);
  frameGradient.addColorStop(1, COLORS.frameDark);
  ctx.fillStyle = frameGradient;
  ctx.fillRect(x, y, frameWidth, frameHeight);

  ctx.strokeStyle = COLORS.frameLight;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 5, y + 5, frameWidth - 10, frameHeight - 10);

  ctx.fillStyle = COLORS.frameDark;
  ctx.fillRect(x + 15, y + 15, frameWidth - 30, 3);
  ctx.fillRect(x + 15, y + frameHeight - 18, frameWidth - 30, 3);
};

const drawBeam = (ctx: CanvasRenderingContext2D, width: number) => {
  const x = FRAME_PADDING + 10;
  const w = width - FRAME_PADDING * 2 - 20;

  ctx.fillStyle = COLORS.beamDark;
  ctx.fillRect(x, BEAM_Y - BEAM_HEIGHT / 2 - 2, w, BEAM_HEIGHT + 4);

  const beamGradient = ctx.createLinearGradient(0, BEAM_Y - BEAM_HEIGHT / 2, 0, BEAM_Y + BEAM_HEIGHT / 2);
  beamGradient.addColorStop(0, '#FFD700');
  beamGradient.addColorStop(0.5, COLORS.beam);
  beamGradient.addColorStop(1, COLORS.beamDark);
  ctx.fillStyle = beamGradient;
  ctx.fillRect(x, BEAM_Y - BEAM_HEIGHT / 2, w, BEAM_HEIGHT);

  ctx.strokeStyle = '#FFF8DC';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, BEAM_Y - BEAM_HEIGHT / 2 + 2);
  ctx.lineTo(x + w, BEAM_Y - BEAM_HEIGHT / 2 + 2);
  ctx.stroke();
};

const drawRods = (ctx: CanvasRenderingContext2D, beads: BeadColumn[], width: number, height: number) => {
  const totalWidth = (beads.length - 1) * COLUMN_SPACING;
  const startX = (width - totalWidth) / 2;

  for (let i = 0; i < beads.length; i++) {
    const x = startX + i * COLUMN_SPACING;
    const rodGradient = ctx.createLinearGradient(x - 2, 0, x + 2, 0);
    rodGradient.addColorStop(0, COLORS.frameDark);
    rodGradient.addColorStop(0.5, COLORS.rod);
    rodGradient.addColorStop(1, COLORS.frameDark);
    ctx.fillStyle = rodGradient;
    ctx.fillRect(x - 2, FRAME_PADDING + 20, 4, height - FRAME_PADDING * 2 - 40);
  }
};

const drawBead = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  type: 'upper' | 'lower',
  isActive: boolean,
  isHighlighted: boolean
) => {
  const baseColor = type === 'upper' ? COLORS.upperBead : COLORS.lowerBead;
  const highlightColor = type === 'upper' ? COLORS.upperBeadHighlight : COLORS.lowerBeadHighlight;
  const shadowColor = type === 'upper' ? '#1A0F09' : COLORS.lowerBeadShadow;

  ctx.save();

  if (isHighlighted) {
    ctx.shadowColor = COLORS.accent;
    ctx.shadowBlur = 15;
  }

  ctx.beginPath();
  ctx.ellipse(x, y + 3, BEAD_RADIUS, BEAD_RADIUS * 0.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(x, y, BEAD_RADIUS, BEAD_RADIUS * 0.6, 0, 0, Math.PI * 2);
  const beadGradient = ctx.createRadialGradient(x - 5, y - 8, 2, x, y, BEAD_RADIUS);
  beadGradient.addColorStop(0, highlightColor);
  beadGradient.addColorStop(0.6, baseColor);
  beadGradient.addColorStop(1, shadowColor);
  ctx.fillStyle = beadGradient;
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(x, y - BEAD_RADIUS * 0.2, BEAD_RADIUS * 0.7, BEAD_RADIUS * 0.25, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(x, y, BEAD_RADIUS, BEAD_RADIUS * 0.6, 0, 0, Math.PI * 2);
  ctx.strokeStyle = isActive ? COLORS.accent : 'rgba(0,0,0,0.3)';
  ctx.lineWidth = isActive ? 2 : 1;
  ctx.stroke();

  ctx.restore();
};

const drawColumnLabel = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  colIdx: number,
  totalCols: number,
  value: number
) => {
  const position = totalCols - colIdx;
  const positionText = position === 1 ? '个' : position === 2 ? '十' : position === 3 ? '百' : position === 4 ? '千' : position === 5 ? '万' : `${position - 4}万`;

  ctx.fillStyle = COLORS.text;
  ctx.font = '12px "KaiTi", "STKaiti", serif';
  ctx.textAlign = 'center';
  ctx.fillText(positionText, x, y);

  if (value > 0) {
    ctx.fillStyle = COLORS.accent;
    ctx.font = 'bold 16px "KaiTi", "STKaiti", serif';
    ctx.fillText(value.toString(), x, y - 20);
  }
};

export const hitTestBead = (
  mouseX: number,
  mouseY: number,
  beads: BeadColumn[],
  type: AbacusType,
  width: number
): { columnIndex: number; beadType: 'upper' | 'lower'; beadIndex: number; position: number } | null => {
  const config = ABACUS_CONFIG[type];
  const totalWidth = (beads.length - 1) * COLUMN_SPACING;
  const startX = (width - totalWidth) / 2;

  for (let colIdx = 0; colIdx < beads.length; colIdx++) {
    const column = beads[colIdx];
    const x = startX + colIdx * COLUMN_SPACING;

    if (Math.abs(mouseX - x) > BEAD_RADIUS + 10) continue;

    for (let j = config.upperBeads - 1; j >= 0; j--) {
      const position = column.upper[j];
      const baseY = BEAM_Y - UPPER_AREA_HEIGHT / 2 + BEAD_RADIUS;
      const targetY = BEAM_Y - BEAM_HEIGHT / 2 - BEAD_RADIUS - 5;
      const y = position === 1 ? targetY : baseY + j * BEAD_SPACING;

      if (Math.abs(mouseY - y) < BEAD_RADIUS + 5) {
        return { columnIndex: colIdx, beadType: 'upper', beadIndex: j, position };
      }
    }

    for (let j = 0; j < config.lowerBeads; j++) {
      const position = column.lower[j];
      const baseY = BEAM_Y + BEAM_HEIGHT / 2 + BEAD_RADIUS + 5;
      const targetY = baseY + (config.lowerBeads - 1) * BEAD_SPACING;
      const y = position === 1 ? baseY + j * BEAD_SPACING : targetY - (config.lowerBeads - 1 - j) * BEAD_SPACING;

      if (Math.abs(mouseY - y) < BEAD_RADIUS + 5) {
        return { columnIndex: colIdx, beadType: 'lower', beadIndex: j, position };
      }
    }
  }

  return null;
};

export const getBeadYPosition = (
  beadType: 'upper' | 'lower',
  beadIndex: number,
  position: number,
  type: AbacusType
): number => {
  const config = ABACUS_CONFIG[type];
  if (beadType === 'upper') {
    const baseY = BEAM_Y - UPPER_AREA_HEIGHT / 2 + BEAD_RADIUS;
    const targetY = BEAM_Y - BEAM_HEIGHT / 2 - BEAD_RADIUS - 5;
    return position === 1 ? targetY : baseY + beadIndex * BEAD_SPACING;
  } else {
    const baseY = BEAM_Y + BEAM_HEIGHT / 2 + BEAD_RADIUS + 5;
    const targetY = baseY + (config.lowerBeads - 1) * BEAD_SPACING;
    return position === 1 ? baseY + beadIndex * BEAD_SPACING : targetY - (config.lowerBeads - 1 - beadIndex) * BEAD_SPACING;
  }
};
