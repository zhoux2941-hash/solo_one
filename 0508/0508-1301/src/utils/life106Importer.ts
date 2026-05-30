import type { Grid } from "./gameEngine";
import { createGrid, setCell } from "./gameEngine";

export interface Life106Data {
  cells: [number, number][];
}

export function parseLife106(content: string): Life106Data {
  const lines = content.trim().split("\n");
  const cells: [number, number][] = [];
  let headerFound = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#")) {
      if (trimmed === "#Life 1.06") {
        headerFound = true;
      }
      continue;
    }

    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      const x = parseInt(parts[0], 10);
      const y = parseInt(parts[1], 10);
      if (!isNaN(x) && !isNaN(y)) {
        cells.push([y, x]);
      }
    }
  }

  if (cells.length === 0) {
    throw new Error("未找到有效的细胞坐标");
  }

  return { cells };
}

export function life106ToGrid(
  data: Life106Data,
  rows: number,
  cols: number
): Grid {
  const grid = createGrid(rows, cols);

  if (data.cells.length === 0) return grid;

  let minR = Infinity, maxR = -Infinity;
  let minC = Infinity, maxC = -Infinity;

  for (const [r, c] of data.cells) {
    minR = Math.min(minR, r);
    maxR = Math.max(maxR, r);
    minC = Math.min(minC, c);
    maxC = Math.max(maxC, c);
  }

  const patternH = maxR - minR + 1;
  const patternW = maxC - minC + 1;
  const offsetR = Math.floor((rows - patternH) / 2) - minR;
  const offsetC = Math.floor((cols - patternW) / 2) - minC;

  for (const [r, c] of data.cells) {
    const nr = r + offsetR;
    const nc = c + offsetC;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
      setCell(grid, cols, nr, nc, 1);
    }
  }

  return grid;
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
