import type { ShellType, PitShape, CrackPoint, CrackBranch, CAMediumProperties, CACell, CAResult } from '@/types';

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 16807 + 0) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  pickIndex(weights: number[]): number {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = this.next() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) return i;
    }
    return weights.length - 1;
  }
}

const CELL_SIZE = 4;
const GRID_W = Math.floor(600 / CELL_SIZE);
const GRID_H = Math.floor(500 / CELL_SIZE);

const NEIGHBORS = [
  { dx: 0, dy: -1, type: 'v' },
  { dx: 1, dy: 0, type: 'h' },
  { dx: 0, dy: 1, type: 'v' },
  { dx: -1, dy: 0, type: 'h' },
  { dx: 1, dy: -1, type: 'd' },
  { dx: 1, dy: 1, type: 'd' },
  { dx: -1, dy: 1, type: 'd' },
  { dx: -1, dy: -1, type: 'd' },
] as const;

function createGrid(): CACell[][] {
  const grid: CACell[][] = [];
  for (let y = 0; y < GRID_H; y++) {
    const row: CACell[] = [];
    for (let x = 0; x < GRID_W; x++) {
      row.push({ state: 0, stress: 0, brokenStep: -1 });
    }
    grid.push(row);
  }
  return grid;
}

function isInsideShellGrid(
  gx: number,
  gy: number,
  shellType: ShellType
): boolean {
  const cx = GRID_W / 2;
  const cy = GRID_H / 2;
  const halfW = shellType === 'plastron' ? GRID_W * 0.36 : GRID_W * 0.33;
  const halfH = shellType === 'plastron' ? GRID_H * 0.36 : GRID_H * 0.38;

  const nx = (gx - cx) / halfW;
  const ny = (gy - cy) / halfH;

  if (shellType === 'plastron') {
    return nx * nx + ny * ny <= 1;
  }
  const stretch = 0.9;
  return nx * nx + (ny * ny) / (stretch * stretch) <= 1;
}

function getMediumProperties(
  anisotropyRatio: number,
  mediumKv: number,
  mediumKh: number,
  mediumKd: number
): CAMediumProperties {
  const baseK = 0.12;
  const baseT = 0.45;

  const Kv = baseK * mediumKv * Math.max(0.5, anisotropyRatio);
  const Kh = baseK * mediumKh * Math.max(0.5, 1 / Math.max(0.1, anisotropyRatio));
  const Kd = baseK * mediumKd * 0.7;

  const Tv = baseT / Math.max(0.5, anisotropyRatio);
  const Th = baseT * Math.max(0.5, anisotropyRatio);
  const Td = (Tv + Th) / 2 * 1.15;

  return {
    Kv: Math.min(Kv, 0.45),
    Kh: Math.min(Kh, 0.45),
    Kd: Math.min(Kd, 0.35),
    Tv: Math.max(Tv, 0.18),
    Th: Math.max(Th, 0.18),
    Td: Math.max(Td, 0.22),
  };
}

function initializeStressSources(
  grid: CACell[][],
  pitPositions: { x: number; y: number }[],
  temperature: number,
  pitShape: PitShape,
  rng: SeededRandom
): void {
  const tempFactor = temperature / 1000;

  for (const pit of pitPositions) {
    const gx = Math.floor(pit.x / CELL_SIZE);
    const gy = Math.floor(pit.y / CELL_SIZE);

    const radius = pitShape === 'circle'
      ? 3 + Math.floor(tempFactor * 2)
      : 4 + Math.floor(tempFactor * 2);

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = gx + dx;
        const y = gy + dy;

        if (x < 0 || x >= GRID_W || y < 0 || y >= GRID_H) continue;

        let dist: number;
        if (pitShape === 'circle') {
          dist = Math.sqrt(dx * dx + dy * dy);
        } else {
          const rotX = dx * 0.866 - dy * 0.5;
          const rotY = dx * 0.5 + dy * 0.866;
          dist = Math.sqrt((rotX * rotX) / 4 + (rotY * rotY));
        }

        if (dist <= radius) {
          const falloff = 1 - dist / radius;
          const noise = rng.range(-0.08, 0.08);
          grid[y][x].stress = Math.min(1, 0.75 * tempFactor * falloff + noise);
        }
      }
    }
  }
}

function diffuseStress(
  grid: CACell[][],
  nextStress: number[][],
  medium: CAMediumProperties,
  shellType: ShellType,
  rng: SeededRandom
): void {
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      if (!isInsideShellGrid(x, y, shellType)) continue;
      if (grid[y][x].state === 2) continue;

      let totalInflux = 0;

      for (const nb of NEIGHBORS) {
        const nx = x + nb.dx;
        const ny = y + nb.dy;

        if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H) continue;
        if (!isInsideShellGrid(nx, ny, shellType)) continue;

        const neighborCell = grid[ny][nx];
        let K: number;
        if (nb.type === 'v') K = medium.Kv;
        else if (nb.type === 'h') K = medium.Kh;
        else K = medium.Kd;

        if (neighborCell.state === 2) {
          const tipAmplification = 1.5;
          const gradient = (neighborCell.stress * tipAmplification - grid[y][x].stress);
          totalInflux += Math.max(0, gradient) * K * 1.3;
        } else {
          const gradient = (neighborCell.stress - grid[y][x].stress);
          totalInflux += gradient * K;
        }
      }

      const dissipation = 0.02;
      const noise = rng.range(-0.015, 0.015);
      nextStress[y][x] = grid[y][x].stress + totalInflux - dissipation * grid[y][x].stress + noise;
      nextStress[y][x] = Math.max(0, Math.min(1.15, nextStress[y][x]));
    }
  }
}

function updateCellStates(
  grid: CACell[][],
  medium: CAMediumProperties,
  step: number,
  shellType: ShellType,
  rng: SeededRandom
): boolean {
  let newlyBroken = false;

  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      if (!isInsideShellGrid(x, y, shellType)) continue;
      if (grid[y][x].state === 2) continue;

      const cell = grid[y][x];

      let minThreshold = Math.min(medium.Tv, medium.Th, medium.Td);

      for (const nb of NEIGHBORS) {
        const nx = x + nb.dx;
        const ny = y + nb.dy;
        if (nx >= 0 && nx < GRID_W && ny >= 0 && ny < GRID_H) {
          if (grid[ny][nx].state === 2) {
            let threshold: number;
            if (nb.type === 'v') threshold = medium.Tv;
            else if (nb.type === 'h') threshold = medium.Th;
            else threshold = medium.Td;

            const tipFactor = 0.75;
            minThreshold = Math.min(minThreshold, threshold * tipFactor);
            break;
          }
        }
      }

      const randomThreshold = minThreshold * rng.range(0.85, 1.15);

      if (cell.state === 0) {
        if (cell.stress >= randomThreshold) {
          cell.state = 1;
        }
      } else if (cell.state === 1) {
        if (cell.stress >= randomThreshold * 1.1) {
          cell.state = 2;
          cell.brokenStep = step;
          newlyBroken = true;

          for (const nb of NEIGHBORS) {
            const nx = x + nb.dx;
            const ny = y + nb.dy;
            if (nx >= 0 && nx < GRID_W && ny >= 0 && ny < GRID_H) {
              if (grid[ny][nx].state === 0) {
                grid[ny][nx].stress = Math.min(1.1, grid[ny][nx].stress + 0.12);
              }
            }
          }
        }
      }
    }
  }

  return newlyBroken;
}

function extractCrackPaths(grid: CACell[][]): { x: number; y: number; width: number }[][] {
  const visited = new Set<string>();
  const paths: { x: number; y: number; width: number }[][] = [];

  function getCellKey(gx: number, gy: number): string {
    return `${gx},${gy}`;
  }

  function getNeighborBroken(gx: number, gy: number): { dx: number; dy: number }[] {
    const result: { dx: number; dy: number }[] = [];
    for (const nb of NEIGHBORS) {
      const nx = gx + nb.dx;
      const ny = gy + nb.dy;
      if (nx >= 0 && nx < GRID_W && ny >= 0 && ny < GRID_H) {
        if (grid[ny][nx].state === 2 && !visited.has(getCellKey(nx, ny))) {
          result.push({ dx: nb.dx, dy: nb.dy });
        }
      }
    }
    return result;
  }

  function tracePath(startGx: number, startGy: number): { x: number; y: number; width: number }[] {
    const path: { x: number; y: number; width: number }[] = [];
    let gx = startGx;
    let gy = startGy;

    while (true) {
      const key = getCellKey(gx, gy);
      if (visited.has(key)) break;
      visited.add(key);

      const cell = grid[gy][gx];
      const px = (gx + 0.5) * CELL_SIZE;
      const py = (gy + 0.5) * CELL_SIZE;
      const width = 1.0 + (1 - cell.brokenStep / 50) * 2.5;

      path.push({ x: px, y: py, width: Math.max(0.8, width) });

      const neighbors = getNeighborBroken(gx, gy);
      if (neighbors.length === 0) break;

      const nb = neighbors[0];
      gx += nb.dx;
      gy += nb.dy;
    }

    return path;
  }

  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      if (grid[y][x].state === 2 && !visited.has(getCellKey(x, y))) {
        const path = tracePath(x, y);
        if (path.length >= 3) {
          paths.push(path);
        }
      }
    }
  }

  return paths;
}

function convertPathsToCrackPoints(
  paths: { x: number; y: number; width: number }[][],
  pitPositions: { x: number; y: number }[]
): CrackPoint[] {
  const crackPoints: CrackPoint[] = [];

  for (const pit of pitPositions) {
    let nearestPath: { x: number; y: number; width: number }[] | null = null;
    let minDist = Infinity;

    for (const path of paths) {
      for (const pt of path) {
        const dist = Math.hypot(pt.x - pit.x, pt.y - pit.y);
        if (dist < minDist) {
          minDist = dist;
          nearestPath = path;
        }
      }
    }

    if (nearestPath && nearestPath.length > 2) {
      const branches: CrackBranch[] = [];
      const startIdx = Math.floor(nearestPath.length * 0.3);

      for (let dir = 0; dir < 2; dir++) {
        const subPath: { x: number; y: number; width: number }[] = [];
        if (dir === 0) {
          for (let i = startIdx; i < nearestPath.length; i++) {
            subPath.push(nearestPath[i]);
          }
        } else {
          for (let i = startIdx; i >= 0; i--) {
            subPath.push(nearestPath[i]);
          }
        }

        if (subPath.length >= 3) {
          const dx = subPath[subPath.length - 1].x - subPath[0].x;
          const dy = subPath[subPath.length - 1].y - subPath[0].y;
          const angle = Math.atan2(dy, dx);
          const length = Math.hypot(dx, dy);
          const avgWidth = subPath.reduce((sum, p) => sum + p.width, 0) / subPath.length;

          branches.push({
            angle,
            length,
            width: avgWidth,
            curvature: 0.15,
            subBranches: [],
          });
        }
      }

      crackPoints.push({
        x: pit.x,
        y: pit.y,
        branches,
      });
    }
  }

  return crackPoints;
}

function generatePitPositions(
  shellType: ShellType,
  temperature: number,
  rng: SeededRandom
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];

  const canvasW = 600;
  const canvasH = 500;
  const centerX = canvasW / 2;
  const centerY = canvasH / 2;

  const halfW = shellType === 'plastron' ? 220 : 200;
  const halfH = shellType === 'plastron' ? 180 : 190;

  const count = Math.floor(temperature / 200) + rng.int(1, 3);

  for (let i = 0; i < count; i++) {
    let x: number, y: number;
    let attempts = 0;
    do {
      x = centerX + rng.range(-halfW * 0.8, halfW * 0.8);
      y = centerY + rng.range(-halfH * 0.7, halfH * 0.5);
      attempts++;

      let tooClose = false;
      for (const p of positions) {
        if (Math.hypot(p.x - x, p.y - y) < 60) {
          tooClose = true;
          break;
        }
      }
      if (!tooClose) break;
    } while (attempts < 50);

    positions.push({ x, y });
  }

  return positions;
}

export function simulateCrackCA(
  shellType: ShellType,
  pitShape: PitShape,
  temperature: number,
  anisotropyRatio: number,
  mediumKv: number,
  mediumKh: number,
  mediumKd: number,
  seed: number = Date.now()
): CAResult {
  const rng = new SeededRandom(seed);

  const grid = createGrid();
  const medium = getMediumProperties(anisotropyRatio, mediumKv, mediumKh, mediumKd);
  const pitPositions = generatePitPositions(shellType, temperature, rng);

  initializeStressSources(grid, pitPositions, temperature, pitShape, rng);

  const maxSteps = Math.max(30, Math.floor(temperature / 20));
  let nextStress: number[][] = grid.map(row => row.map(cell => cell.stress));

  for (let step = 0; step < maxSteps; step++) {
    diffuseStress(grid, nextStress, medium, shellType, rng);

    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        if (isInsideShellGrid(x, y, shellType) && grid[y][x].state !== 2) {
          grid[y][x].stress = nextStress[y][x];
        }
      }
    }

    const hasNew = updateCellStates(grid, medium, step, shellType, rng);
    if (!hasNew && step > 15) break;
  }

  const paths = extractCrackPaths(grid);
  const crackPoints = convertPathsToCrackPoints(paths, pitPositions);

  return {
    crackPaths: paths,
    crackPoints,
    cellSize: CELL_SIZE,
  };
}

export function generateCrackPoints(
  shellType: ShellType,
  pitShape: PitShape,
  temperature: number,
  anisotropyRatio: number = 1.5,
  mediumKv: number = 1.0,
  mediumKh: number = 1.0,
  mediumKd: number = 1.0,
  seed: number = Date.now()
): CrackPoint[] {
  const result = simulateCrackCA(
    shellType,
    pitShape,
    temperature,
    anisotropyRatio,
    mediumKv,
    mediumKh,
    mediumKd,
    seed
  );
  return result.crackPoints;
}

export { SeededRandom };
