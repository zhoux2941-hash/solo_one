import { Stone } from '@/types';

export interface DrawOptions {
  boardSize: number;
  cellSize: number;
  padding: number;
}

export const getBoardDimensions = (boardSize: number, canvasSize: number) => {
  const padding = canvasSize * 0.06;
  const playableSize = canvasSize - padding * 2;
  const cellSize = playableSize / (boardSize - 1);
  return { padding, cellSize };
};

export const getIntersectionFromCoords = (
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  boardSize: number,
  cellSize: number,
  padding: number
) => {
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left - padding;
  const y = clientY - rect.top - padding;

  const col = Math.round(x / cellSize);
  const row = Math.round(y / cellSize);

  if (col >= 0 && col < boardSize && row >= 0 && row < boardSize) {
    return { x: col, y: row };
  }
  return null;
};

export const drawBoard = (
  ctx: CanvasRenderingContext2D,
  boardSize: number,
  cellSize: number,
  padding: number
) => {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#E8C88B');
  gradient.addColorStop(0.5, '#D4A76A');
  gradient.addColorStop(1, '#C4965A');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 1;

  for (let i = 0; i < boardSize; i++) {
    ctx.beginPath();
    ctx.moveTo(padding, padding + i * cellSize);
    ctx.lineTo(width - padding, padding + i * cellSize);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(padding + i * cellSize, padding);
    ctx.lineTo(padding + i * cellSize, height - padding);
    ctx.stroke();
  }

  const starPoints = getStarPoints(boardSize);
  ctx.fillStyle = '#8B6914';
  starPoints.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(padding + x * cellSize, padding + y * cellSize, 4, 0, Math.PI * 2);
    ctx.fill();
  });
};

const getStarPoints = (boardSize: number): [number, number][] => {
  if (boardSize === 9) {
    return [
      [2, 2], [6, 2],
      [4, 4],
      [2, 6], [6, 6],
    ];
  }
  if (boardSize === 13) {
    return [
      [3, 3], [9, 3],
      [6, 6],
      [3, 9], [9, 9],
    ];
  }
  return [
    [3, 3], [9, 3], [15, 3],
    [3, 9], [9, 9], [15, 9],
    [3, 15], [9, 15], [15, 15],
    [9, 3], [9, 9], [9, 15],
  ];
};

export const drawStone = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: 'black' | 'white',
  cellSize: number,
  padding: number,
  scale: number = 1
) => {
  const centerX = padding + x * cellSize;
  const centerY = padding + y * cellSize;
  const radius = (cellSize * 0.45) * scale;

  ctx.save();

  if (color === 'black') {
    const gradient = ctx.createRadialGradient(
      centerX - radius * 0.3,
      centerY - radius * 0.3,
      radius * 0.1,
      centerX,
      centerY,
      radius
    );
    gradient.addColorStop(0, '#4A4A4A');
    gradient.addColorStop(0.5, '#1A1A1A');
    gradient.addColorStop(1, '#0D0D0D');
    ctx.fillStyle = gradient;
  } else {
    const gradient = ctx.createRadialGradient(
      centerX - radius * 0.3,
      centerY - radius * 0.3,
      radius * 0.1,
      centerX,
      centerY,
      radius
    );
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(0.7, '#F5F5F0');
    gradient.addColorStop(1, '#D8D8D0');
    ctx.fillStyle = gradient;
  }

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
};

export const drawLastMoveMarker = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  padding: number
) => {
  const centerX = padding + x * cellSize;
  const centerY = padding + y * cellSize;

  ctx.fillStyle = '#C0392B';
  ctx.beginPath();
  ctx.arc(centerX, centerY, cellSize * 0.15, 0, Math.PI * 2);
  ctx.fill();
};

export const drawHintMarker = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  padding: number
) => {
  const centerX = padding + x * cellSize;
  const centerY = padding + y * cellSize;

  ctx.save();
  ctx.strokeStyle = '#27AE60';
  ctx.lineWidth = 3;
  ctx.setLineDash([5, 3]);
  ctx.beginPath();
  ctx.arc(centerX, centerY, cellSize * 0.35, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
};

export const drawAnswerStone = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: 'black' | 'white',
  cellSize: number,
  padding: number,
  order: number
) => {
  const centerX = padding + x * cellSize;
  const centerY = padding + y * cellSize;
  const radius = cellSize * 0.45;

  ctx.save();
  ctx.globalAlpha = 0.7;

  if (color === 'black') {
    ctx.fillStyle = '#333';
  } else {
    ctx.fillStyle = '#DDD';
  }

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.fillStyle = color === 'black' ? '#FFF' : '#000';
  ctx.font = `bold ${cellSize * 0.5}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(order), centerX, centerY);

  ctx.restore();
};

export const redrawBoard = (
  ctx: CanvasRenderingContext2D,
  boardSize: number,
  cellSize: number,
  padding: number,
  stones: Stone[],
  lastMove: { x: number; y: number } | null,
  showHints: boolean,
  hintPoints: { x: number; y: number }[],
  showAnswer: boolean,
  refAnswer: { x: number; y: number; color: 'black' | 'white'; order: number }[],
  animatingStone: { x: number; y: number; color: 'black' | 'white'; progress: number } | null
) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  drawBoard(ctx, boardSize, cellSize, padding);

  if (showHints) {
    hintPoints.forEach(({ x, y }) => {
      drawHintMarker(ctx, x, y, cellSize, padding);
    });
  }

  stones.forEach(stone => {
    drawStone(ctx, stone.x, stone.y, stone.color, cellSize, padding);
  });

  if (animatingStone) {
    const scale = 1 + 0.2 * (1 - animatingStone.progress);
    drawStone(
      ctx,
      animatingStone.x,
      animatingStone.y,
      animatingStone.color,
      cellSize,
      padding,
      scale
    );
  }

  if (lastMove && !animatingStone) {
    drawLastMoveMarker(ctx, lastMove.x, lastMove.y, cellSize, padding);
  }

  if (showAnswer) {
    refAnswer.forEach(move => {
      drawAnswerStone(ctx, move.x, move.y, move.color, cellSize, padding, move.order);
    });
  }
};
