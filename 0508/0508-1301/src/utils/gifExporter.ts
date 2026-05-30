import GIF from "gif.js";
import type { Grid, BoundaryMode } from "./gameEngine";
import { nextGeneration, cloneGrid } from "./gameEngine";
import { renderGridToCanvas } from "./gridRenderer";

export interface GifExportOptions {
  initialGrid: Grid;
  rows: number;
  cols: number;
  boundaryMode: BoundaryMode;
  frameCount: number;
  frameDelay: number;
  showGridLines: boolean;
  cellSize: number;
  onProgress?: (progress: number, frame: number, total: number) => void;
}

export async function exportToGif(options: GifExportOptions): Promise<Blob> {
  const {
    initialGrid,
    rows,
    cols,
    boundaryMode,
    frameCount,
    frameDelay,
    showGridLines,
    cellSize,
    onProgress,
  } = options;

  const width = cols * cellSize;
  const height = rows * cellSize;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const gif = new GIF({
    workers: 2,
    quality: 10,
    width,
    height,
    workerScript: "https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js",
  });

  let currentGrid = cloneGrid(initialGrid);

  for (let i = 0; i < frameCount; i++) {
    renderGridToCanvas(canvas, currentGrid, rows, cols, {
      showGridLines,
      cellSize,
      width,
      height,
    });

    const ctx = canvas.getContext("2d");
    if (ctx) {
      gif.addFrame(ctx, { copy: true, delay: frameDelay });
    }

    if (onProgress) {
      onProgress((i + 1) / frameCount, i + 1, frameCount);
    }

    if (i < frameCount - 1) {
      currentGrid = nextGeneration(currentGrid, rows, cols, boundaryMode);
    }

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return new Promise((resolve, reject) => {
    gif.on("finished", (blob: Blob) => {
      resolve(blob);
    });
    (gif as any).on("error", (error: Error) => {
      reject(error);
    });
    try {
      gif.render();
    } catch (e) {
      reject(e);
    }
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
