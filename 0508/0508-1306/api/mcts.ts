const BOARD_SIZE = 17;

const POSITION_WEIGHT: number[][] = [
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

type Cell = 'black' | 'white' | null;

interface GameState {
  board: Cell[][];
  currentPlayer: 'black' | 'white';
  moveCount: number;
  lastMove: { x: number; y: number } | null;
  passed: boolean;
}

interface MCTSNode {
  state: GameState;
  move: { x: number; y: number } | null;
  parent: MCTSNode | null;
  children: MCTSNode[];
  visits: number;
  wins: number;
  untriedMoves: { x: number; y: number }[];
}

function cloneBoard(board: Cell[][]): Cell[][] {
  return board.map((row: Cell[]) => [...row]);
}

function createGameState(board: Cell[][], currentPlayer: 'black' | 'white', moveCount: number, lastMove: { x: number; y: number } | null): GameState {
  return { board: cloneBoard(board), currentPlayer, moveCount, lastMove, passed: false };
}

function getNeighborCoords(x: number, y: number): [number, number][] {
  const neighbors: [number, number][] = [];
  const dirs: [number, number][] = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  for (const [dx, dy] of dirs) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
      neighbors.push([nx, ny]);
    }
  }
  return neighbors;
}

function getGroupAndLiberties(board: Cell[][], x: number, y: number): { stones: Set<string>; liberties: number } {
  const color = board[y][x];
  if (!color) return { stones: new Set(), liberties: 0 };

  const stones = new Set<string>();
  const libertySet = new Set<string>();
  const stack: [number, number][] = [[x, y]];

  while (stack.length > 0) {
    const [cx, cy] = stack.pop()!;
    const key = `${cx},${cy}`;
    if (stones.has(key)) continue;
    stones.add(key);

    for (const [nx, ny] of getNeighborCoords(cx, cy)) {
      const nKey = `${nx},${ny}`;
      if (board[ny][nx] === null) {
        libertySet.add(nKey);
      } else if (board[ny][nx] === color && !stones.has(nKey)) {
        stack.push([nx, ny]);
      }
    }
  }

  return { stones, liberties: libertySet.size };
}

function removeGroup(board: Cell[][], stones: Set<string>): void {
  for (const key of stones) {
    const [x, y] = key.split(',').map(Number);
    board[y][x] = null;
  }
}

function applyMove(state: GameState, x: number, y: number): GameState {
  const newBoard = cloneBoard(state.board);
  const color = state.currentPlayer;
  const opponent: Cell = color === 'black' ? 'white' : 'black';

  newBoard[y][x] = color;

  for (const [nx, ny] of getNeighborCoords(x, y)) {
    if (newBoard[ny][nx] === opponent) {
      const group = getGroupAndLiberties(newBoard, nx, ny);
      if (group.liberties === 0) {
        removeGroup(newBoard, group.stones);
      }
    }
  }

  const selfGroup = getGroupAndLiberties(newBoard, x, y);
  if (selfGroup.liberties === 0) {
    removeGroup(newBoard, selfGroup.stones);
  }

  return {
    board: newBoard,
    currentPlayer: opponent as 'black' | 'white',
    moveCount: state.moveCount + 1,
    lastMove: { x, y },
    passed: false,
  };
}

function getCandidateMoves(state: GameState): { x: number; y: number }[] {
  const candidates: { x: number; y: number; priority: number }[] = [];
  const searchRadius = 3;

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (state.board[y][x] !== null) continue;

      let nearStone = state.moveCount === 0;
      if (!nearStone) {
        for (let dy = -searchRadius; dy <= searchRadius && !nearStone; dy++) {
          for (let dx = -searchRadius; dx <= searchRadius && !nearStone; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
              if (state.board[ny][nx] !== null) {
                nearStone = true;
              }
            }
          }
        }
      }
      if (!nearStone) continue;

      const tempState = applyMove(state, x, y);
      const selfGroup = getGroupAndLiberties(tempState.board, x, y);
      if (selfGroup.liberties === 0 && selfGroup.stones.size > 0) continue;

      let priority = POSITION_WEIGHT[y][x];
      const neighbors = getNeighborCoords(x, y);
      for (const [nx, ny] of neighbors) {
        if (state.board[ny][nx] !== null) priority += 5;
      }
      if (state.lastMove) {
        const dist = Math.abs(state.lastMove.x - x) + Math.abs(state.lastMove.y - y);
        if (dist <= 2) priority += 10;
      }

      candidates.push({ x, y, priority });
    }
  }

  candidates.sort((a, b) => b.priority - a.priority);
  return candidates.slice(0, 30).map((c) => ({ x: c.x, y: c.y }));
}

function evaluateBoard(board: Cell[][], color: 'black' | 'white'): number {
  const opponent: Cell = color === 'black' ? 'white' : 'black';
  let myScore = 0;
  let oppScore = 0;

  const processed = new Set<string>();

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const stone = board[y][x];
      if (stone && !processed.has(`${x},${y}`)) {
        const group = getGroupAndLiberties(board, x, y);
        for (const key of group.stones) {
          processed.add(key);
        }
        const value = group.stones.size * 2 + group.liberties;
        if (stone === color) {
          myScore += value;
        } else {
          oppScore += value;
        }
      }
    }
  }

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (board[y][x] === null) {
        let myAdj = 0;
        let oppAdj = 0;
        for (const [nx, ny] of getNeighborCoords(x, y)) {
          if (board[ny][nx] === color) myAdj++;
          else if (board[ny][nx] === opponent) oppAdj++;
        }
        if (myAdj > 0 && oppAdj === 0) myScore += 0.5;
        else if (oppAdj > 0 && myAdj === 0) oppScore += 0.5;
      }
    }
  }

  const total = myScore + oppScore;
  if (total === 0) return 0.5;
  return myScore / total;
}

function select(node: MCTSNode): MCTSNode {
  while (node.untriedMoves.length === 0 && node.children.length > 0) {
    const c = Math.sqrt(2);
    node = node.children.reduce((best, child) => {
      const ucb = (child.wins / child.visits) + c * Math.sqrt(Math.log(node.visits) / child.visits);
      const bestUcb = (best.wins / best.visits) + c * Math.sqrt(Math.log(node.visits) / best.visits);
      return ucb > bestUcb ? child : best;
    });
  }
  return node;
}

function expand(node: MCTSNode): MCTSNode {
  if (node.untriedMoves.length === 0) return node;
  const idx = Math.floor(Math.random() * node.untriedMoves.length);
  const move = node.untriedMoves.splice(idx, 1)[0];
  const newState = applyMove(node.state, move.x, move.y);
  const child: MCTSNode = {
    state: newState,
    move,
    parent: node,
    children: [],
    visits: 0,
    wins: 0,
    untriedMoves: getCandidateMoves(newState),
  };
  node.children.push(child);
  return child;
}

function simulate(state: GameState, maxDepth: number = 30): 'black' | 'white' | 'draw' {
  let current = state;
  let depth = 0;
  let consecutivePasses = 0;

  while (depth < maxDepth && consecutivePasses < 2) {
    const moves = getCandidateMoves(current);
    if (moves.length === 0) {
      consecutivePasses++;
      current = {
        ...current,
        currentPlayer: current.currentPlayer === 'black' ? 'white' : 'black',
        passed: true,
      };
      depth++;
      continue;
    }

    consecutivePasses = 0;
    const move = moves[Math.floor(Math.random() * moves.length)];
    current = applyMove(current, move.x, move.y);
    depth++;
  }

  const score = evaluateBoard(current.board, state.currentPlayer);
  if (score > 0.55) return state.currentPlayer;
  if (score < 0.45) {
    return state.currentPlayer === 'black' ? 'white' : 'black';
  }
  return 'draw';
}

function backpropagate(node: MCTSNode, winner: 'black' | 'white' | 'draw'): void {
  let current: MCTSNode | null = node;
  while (current !== null) {
    current.visits++;
    if (winner === 'draw') {
      current.wins += 0.5;
    } else {
      const nodeColor = current.move === null
        ? (current.parent === null ? 'black' : (current.parent.state.currentPlayer))
        : current.parent!.state.currentPlayer;
      if (winner === nodeColor) {
        current.wins += 1;
      }
    }
    current = current.parent;
  }
}

export function runMCTS(
  board: Cell[][],
  currentPlayer: 'black' | 'white',
  moveCount: number,
  maxTimeMs: number = 2000
): { position: { x: number; y: number }; winRate: number; visits: number }[] {
  const initialState = createGameState(board, currentPlayer, moveCount, null);
  const candidateMoves = getCandidateMoves(initialState);

  if (candidateMoves.length === 0) return [];

  const root: MCTSNode = {
    state: initialState,
    move: null,
    parent: null,
    children: [],
    visits: 0,
    wins: 0,
    untriedMoves: [...candidateMoves],
  };

  const startTime = Date.now();
  let iterations = 0;

  while (Date.now() - startTime < maxTimeMs) {
    let node = select(root);

    if (node.untriedMoves.length > 0) {
      node = expand(node);
    }

    const winner = simulate(node.state);
    backpropagate(node, winner);
    iterations++;
  }

  const results = root.children
    .filter((child) => child.move !== null)
    .map((child) => {
      const nodeColor = child.parent!.state.currentPlayer;
      const winRate = child.visits > 0 ? child.wins / child.visits : 0;
      return {
        position: child.move!,
        winRate: Math.round(winRate * 100),
        visits: child.visits,
      };
    })
    .sort((a, b) => b.visits - a.visits);

  return results.slice(0, 5);
}
