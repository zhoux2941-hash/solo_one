export type BoundaryMode = "toroidal" | "fixed";

export type Grid = Uint8Array;

export function createGrid(rows: number, cols: number): Grid {
  return new Uint8Array(rows * cols);
}

export function getCell(grid: Grid, cols: number, row: number, col: number): number {
  return grid[row * cols + col];
}

export function setCell(grid: Grid, cols: number, row: number, col: number, value: number): void {
  grid[row * cols + col] = value;
}

export function countNeighbors(grid: Grid, rows: number, cols: number, row: number, col: number, boundary: BoundaryMode = "toroidal"): number {
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      let r = row + dr;
      let c = col + dc;
      if (boundary === "toroidal") {
        r = (r + rows) % rows;
        c = (c + cols) % cols;
        count += grid[r * cols + c];
      } else {
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          count += grid[r * cols + c];
        }
      }
    }
  }
  return count;
}

export function nextGeneration(grid: Grid, rows: number, cols: number, boundary: BoundaryMode = "toroidal"): Grid {
  const next = new Uint8Array(rows * cols);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const alive = grid[idx];
      const neighbors = countNeighbors(grid, rows, cols, r, c, boundary);
      if (alive) {
        next[idx] = neighbors === 2 || neighbors === 3 ? 1 : 0;
      } else {
        next[idx] = neighbors === 3 ? 1 : 0;
      }
    }
  }
  return next;
}

export function randomize(rows: number, cols: number, probability: number): Grid {
  const grid = new Uint8Array(rows * cols);
  for (let i = 0; i < grid.length; i++) {
    grid[i] = Math.random() < probability ? 1 : 0;
  }
  return grid;
}

export function clearGrid(rows: number, cols: number): Grid {
  return new Uint8Array(rows * cols);
}

export function countAlive(grid: Grid): number {
  let count = 0;
  for (let i = 0; i < grid.length; i++) {
    count += grid[i];
  }
  return count;
}

export function cloneGrid(grid: Grid): Grid {
  return new Uint8Array(grid);
}
