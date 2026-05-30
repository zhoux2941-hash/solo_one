import { Move, WinRateData, BOARD_SIZE, Position } from '../../shared/types';

const POSITION_VALUES: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 1],
  [1, 2, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 2, 1],
  [1, 2, 3, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 4, 3, 2, 1],
  [1, 2, 3, 4, 5, 6, 6, 6, 6, 6, 6, 6, 5, 4, 3, 2, 1],
  [1, 2, 3, 4, 5, 6, 7, 7, 7, 7, 7, 6, 5, 4, 3, 2, 1],
  [1, 2, 3, 4, 5, 6, 7, 8, 8, 8, 7, 6, 5, 4, 3, 2, 1],
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2, 1],
  [1, 2, 3, 4, 5, 6, 7, 8, 8, 8, 7, 6, 5, 4, 3, 2, 1],
  [1, 2, 3, 4, 5, 6, 7, 7, 7, 7, 7, 6, 5, 4, 3, 2, 1],
  [1, 2, 3, 4, 5, 6, 6, 6, 6, 6, 6, 6, 5, 4, 3, 2, 1],
  [1, 2, 3, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 4, 3, 2, 1],
  [1, 2, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 2, 1],
  [1, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

function getNeighbors(pos: Position): Position[] {
  const neighbors: Position[] = [];
  const directions = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ];
  
  for (const dir of directions) {
    const nx = pos.x + dir.x;
    const ny = pos.y + dir.y;
    if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
      neighbors.push({ x: nx, y: ny });
    }
  }
  
  return neighbors;
}

function calculateLiberties(board: (string | null)[][], pos: Position, color: string, visited: Set<string>): number {
  const key = `${pos.x},${pos.y}`;
  if (visited.has(key)) return 0;
  
  const stone = board[pos.y][pos.x];
  if (stone === null) return 1;
  if (stone !== color) return 0;
  
  visited.add(key);
  
  let liberties = 0;
  for (const neighbor of getNeighbors(pos)) {
    liberties += calculateLiberties(board, neighbor, color, visited);
  }
  
  return liberties;
}

function countGroupsAndLiberties(moves: Move[]): { blackScore: number; whiteScore: number } {
  const board: (string | null)[][] = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
  
  for (const move of moves) {
    board[move.position.y][move.position.x] = move.color;
  }
  
  let blackScore = 0;
  let whiteScore = 0;
  const processed = new Set<string>();
  
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const stone = board[y][x];
      if (stone && !processed.has(`${x},${y}`)) {
        const visited = new Set<string>();
        const liberties = calculateLiberties(board, { x, y }, stone, visited);
        
        const groupSize = visited.size;
        const groupValue = groupSize * POSITION_VALUES[y][x] + liberties * 2;
        
        if (stone === 'black') {
          blackScore += groupValue;
        } else {
          whiteScore += groupValue;
        }
        
        for (const key of visited) {
          processed.add(key);
        }
      }
    }
  }
  
  return { blackScore, whiteScore };
}

export function calculateWinRate(moves: Move[]): { blackWinRate: number; whiteWinRate: number } {
  const { blackScore, whiteScore } = countGroupsAndLiberties(moves);
  
  const totalScore = blackScore + whiteScore;
  
  if (totalScore === 0) {
    return { blackWinRate: 50, whiteWinRate: 50 };
  }
  
  const lastMove = moves[moves.length - 1];
  const turnBonus = lastMove && lastMove.color === 'white' ? 3 : 0;
  
  let blackWinRate = Math.round((blackScore / totalScore) * 100) + turnBonus;
  blackWinRate = Math.max(5, Math.min(95, blackWinRate));
  
  return {
    blackWinRate,
    whiteWinRate: 100 - blackWinRate,
  };
}

export function calculateWinRateHistory(moves: Move[]): WinRateData[] {
  const history: WinRateData[] = [];
  
  for (let i = 1; i <= moves.length; i++) {
    const partialMoves = moves.slice(0, i);
    const { blackWinRate, whiteWinRate } = calculateWinRate(partialMoves);
    
    history.push({
      moveNumber: i,
      blackWinRate,
      whiteWinRate,
    });
  }
  
  return history;
}
