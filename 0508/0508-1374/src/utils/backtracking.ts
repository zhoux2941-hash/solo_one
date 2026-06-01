import { QueenPositions, AlgorithmStep } from '@/types';

function checkConflict(
  board: QueenPositions,
  row: number,
  col: number
): [number, number][] {
  const conflicts: [number, number][] = [];

  for (let r = 0; r < row; r++) {
    const c = board[r];
    if (c === -1) continue;

    if (c === col) {
      conflicts.push([r, c]);
    }

    if (Math.abs(r - row) === Math.abs(c - col)) {
      conflicts.push([r, c]);
    }
  }

  return conflicts;
}

export function generateBacktrackingSteps(n: number): {
  steps: AlgorithmStep[];
  solutions: QueenPositions[];
} {
  const steps: AlgorithmStep[] = [];
  const solutions: QueenPositions[] = [];
  const board: QueenPositions = new Array(n).fill(-1);

  function backtrack(row: number): void {
    if (row === n) {
      const solution = [...board];
      solutions.push(solution);
      steps.push({
        row: row - 1,
        col: board[row - 1],
        action: 'solution',
        board: [...board],
        conflictCells: [],
        description: `找到第 ${solutions.length} 个解！`,
      });
      return;
    }

    for (let col = 0; col < n; col++) {
      const conflicts = checkConflict(board, row, col);

      steps.push({
        row,
        col,
        action: 'place',
        board: [...board],
        conflictCells: conflicts,
        description: `尝试在第 ${row + 1} 行第 ${col + 1} 列放置皇后`,
      });

      if (conflicts.length > 0) {
        steps.push({
          row,
          col,
          action: 'conflict',
          board: [...board],
          conflictCells: conflicts,
          description: `检测到冲突！与 ${conflicts.map(([r, c]) => `(${r + 1},${c + 1})`).join(', ')} 冲突`,
        });
      } else {
        board[row] = col;

        backtrack(row + 1);

        board[row] = -1;

        steps.push({
          row,
          col,
          action: 'backtrack',
          board: [...board],
          conflictCells: [],
          description: `回溯：移除第 ${row + 1} 行第 ${col + 1} 列的皇后`,
        });
      }
    }
  }

  backtrack(0);

  return { steps, solutions };
}

export function countSolutions(n: number): number {
  const board: QueenPositions = new Array(n).fill(-1);
  let count = 0;

  function backtrack(row: number): void {
    if (row === n) {
      count++;
      return;
    }

    for (let col = 0; col < n; col++) {
      let hasConflict = false;
      for (let r = 0; r < row; r++) {
        const c = board[r];
        if (c === col || Math.abs(r - row) === Math.abs(c - col)) {
          hasConflict = true;
          break;
        }
      }

      if (!hasConflict) {
        board[row] = col;
        backtrack(row + 1);
        board[row] = -1;
      }
    }
  }

  backtrack(0);
  return count;
}
