import type { Grid } from "./gameEngine";

export const CELL_DEAD = "#0d1117";
export const CELL_ALIVE = "#00ff88";
export const CELL_ALIVE_GLOW = "#00cc6a";
export const GRID_LINE_COLOR = "#1a2332";

export interface RenderOptions {
  showGridLines?: boolean;
  cellSize?: number;
  width?: number;
  height?: number;
}

export function renderGridToCanvas(
  canvas: HTMLCanvasElement,
  grid: Grid,
  rows: number,
  cols: number,
  options: RenderOptions = {}
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { showGridLines = true, cellSize, width, height } = options;

  const dpr = window.devicePixelRatio || 1;
  const rect = width && height
    ? { width, height }
    : canvas.getBoundingClientRect();

  const targetW = rect.width;
  const targetH = rect.height;

  canvas.width = targetW * dpr;
  canvas.height = targetH * dpr;
  ctx.scale(dpr, dpr);

  const cellW = targetW / cols;
  const cellH = targetH / rows;
  const size = cellSize ?? Math.min(cellW, cellH);
  const offsetX = (targetW - size * cols) / 2;
  const offsetY = (targetH - size * rows) / 2;

  ctx.fillStyle = CELL_DEAD;
  ctx.fillRect(0, 0, targetW, targetH);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = offsetX + c * size;
      const y = offsetY + r * size;
      if (grid[r * cols + c]) {
        ctx.fillStyle = CELL_ALIVE;
        ctx.fillRect(x + 0.5, y + 0.5, size - 1, size - 1);
        if (size > 4) {
          ctx.fillStyle = CELL_ALIVE_GLOW;
          ctx.fillRect(x + 1.5, y + 1.5, size - 3.5, size - 3.5);
        }
      } else {
        ctx.fillStyle = CELL_DEAD;
        ctx.fillRect(x + 0.5, y + 0.5, size - 1, size - 1);
      }
    }
  }

  if (showGridLines && size > 3) {
    ctx.strokeStyle = GRID_LINE_COLOR;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let r = 0; r <= rows; r++) {
      const y = offsetY + r * size;
      ctx.moveTo(offsetX, y);
      ctx.lineTo(offsetX + cols * size, y);
    }
    for (let c = 0; c <= cols; c++) {
      const x = offsetX + c * size;
      ctx.moveTo(x, offsetY);
      ctx.lineTo(x, offsetY + rows * size);
    }
    ctx.stroke();
  }
}
