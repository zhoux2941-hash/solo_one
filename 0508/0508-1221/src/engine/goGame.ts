export type CellState = 0 | 1 | 2;
export type PlayerColor = 1 | 2;

const EMPTY: CellState = 0;
export const BLACK: PlayerColor = 1;
export const WHITE: PlayerColor = 2;

export const opponent = (c: PlayerColor): PlayerColor => c === BLACK ? WHITE : BLACK;

export interface GoState {
  board: CellState[];
  size: number;
  turn: PlayerColor;
  koPoint: number | null;
  blackCaptured: number;
  whiteCaptured: number;
  lastMove: number | null;
  passCount: number;
}

const CellStateArray = (() => { class A extends Array<CellState> { constructor(n: number) { super(n); this.fill(EMPTY); } } return A; })();

export const createGoState = (size: number, initialStones?: { x: number; y: number; color: 'black' | 'white' }[]): GoState => {
  const board = new CellStateArray(size * size) as CellState[];
  if (initialStones) {
    for (const s of initialStones) {
      board[s.y * size + s.x] = s.color === 'black' ? BLACK : WHITE;
    }
  }
  return { board, size, turn: BLACK, koPoint: null, blackCaptured: 0, whiteCaptured: 0, lastMove: null, passCount: 0 };
};

export const cloneState = (state: GoState): GoState => ({
  board: state.board.slice() as CellState[],
  size: state.size,
  turn: state.turn,
  koPoint: state.koPoint,
  blackCaptured: state.blackCaptured,
  whiteCaptured: state.whiteCaptured,
  lastMove: state.lastMove,
  passCount: state.passCount,
});

const getNeighbors = (idx: number, size: number): number[] => {
  const x = idx % size;
  const y = (idx - x) / size;
  const n: number[] = [];
  if (x > 0) n.push(idx - 1);
  if (x < size - 1) n.push(idx + 1);
  if (y > 0) n.push(idx - size);
  if (y < size - 1) n.push(idx + size);
  return n;
};

export const getGroup = (board: CellState[], idx: number, size: number): { stones: number[]; liberties: number } => {
  const color = board[idx];
  if (color === EMPTY) return { stones: [], liberties: 0 };
  const visited = new Set<number>();
  const stones: number[] = [];
  const libertySet = new Set<number>();
  const stack = [idx];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    if (visited.has(cur)) continue;
    visited.add(cur);
    stones.push(cur);
    for (const nb of getNeighbors(cur, size)) {
      if (board[nb] === EMPTY) libertySet.add(nb);
      else if (board[nb] === color && !visited.has(nb)) stack.push(nb);
    }
  }
  return { stones, liberties: libertySet.size };
};

export const removeGroup = (board: CellState[], stones: number[]): void => { for (const i of stones) board[i] = EMPTY; };

export const isLegalMove = (state: GoState, idx: number): boolean => {
  if (idx < 0 || idx >= state.size * state.size) return false;
  if (state.board[idx] !== EMPTY) return false;
  if (idx === state.koPoint) return false;
  const tb = state.board.slice();
  tb[idx] = state.turn;
  const opp = opponent(state.turn);
  let captured = 0;
  for (const nb of getNeighbors(idx, state.size)) {
    if (tb[nb] === opp) {
      const g = getGroup(tb, nb, state.size);
      if (g.liberties === 0) { captured += g.stones.length; removeGroup(tb, g.stones); }
    }
  }
  if (captured === 0) {
    const sg = getGroup(tb, idx, state.size);
    if (sg.liberties === 0) return false;
  }
  return true;
};

export const playMove = (state: GoState, idx: number): GoState => {
  if (!isLegalMove(state, idx)) return state;
  const next = cloneState(state);
  next.board[idx] = next.turn;
  const opp = opponent(next.turn);
  let totalCap = 0;
  let capStones: number[] = [];
  for (const nb of getNeighbors(idx, next.size)) {
    if (next.board[nb] === opp) {
      const g = getGroup(next.board, nb, next.size);
      if (g.liberties === 0) { totalCap += g.stones.length; capStones = capStones.concat(g.stones); removeGroup(next.board, g.stones); }
    }
  }
  if (next.turn === BLACK) next.blackCaptured += totalCap; else next.whiteCaptured += totalCap;
  if (totalCap === 1 && capStones.length === 1) {
    const sg = getGroup(next.board, idx, next.size);
    next.koPoint = (sg.stones.length === 1 && sg.liberties === 1) ? capStones[0] : null;
  } else { next.koPoint = null; }
  next.lastMove = idx;
  next.passCount = 0;
  next.turn = opp;
  return next;
};

export const pass = (state: GoState): GoState => {
  const next = cloneState(state);
  next.passCount++;
  next.koPoint = null;
  next.turn = opponent(next.turn);
  next.lastMove = null;
  return next;
};

export const getLegalMoves = (state: GoState): number[] => {
  const moves: number[] = [];
  const total = state.size * state.size;
  for (let i = 0; i < total; i++) { if (isLegalMove(state, i)) moves.push(i); }
  return moves;
};

export const toIndex = (x: number, y: number, size: number): number => y * size + x;
export const toCoord = (idx: number, size: number): { x: number; y: number } => ({ x: idx % size, y: Math.floor(idx / size) });

export const getStonesFromState = (state: GoState): { x: number; y: number; color: 'black' | 'white' }[] => {
  const stones: { x: number; y: number; color: 'black' | 'white' }[] = [];
  for (let i = 0; i < state.board.length; i++) {
    if (state.board[i] !== EMPTY) {
      const c = toCoord(i, state.size);
      stones.push({ x: c.x, y: c.y, color: state.board[i] === BLACK ? 'black' : 'white' });
    }
  }
  return stones;
};

export const isGameOver = (state: GoState): boolean => state.passCount >= 2;

export interface TerritoryCount { blackTerritory: number; whiteTerritory: number; blackStones: number; whiteStones: number; }

export const countTerritory = (state: GoState): TerritoryCount => {
  const visited = new Set<number>();
  let bt = 0, wt = 0, bs = 0, ws = 0;
  for (let i = 0; i < state.board.length; i++) {
    if (state.board[i] === BLACK) { bs++; continue; }
    if (state.board[i] === WHITE) { ws++; continue; }
    if (visited.has(i)) continue;
    const eg: number[] = [];
    const borders = new Set<PlayerColor>();
    const stack = [i];
    while (stack.length > 0) {
      const cur = stack.pop()!;
      if (visited.has(cur)) continue;
      if (state.board[cur] !== EMPTY) { borders.add(state.board[cur] as PlayerColor); continue; }
      visited.add(cur);
      eg.push(cur);
      for (const nb of getNeighbors(cur, state.size)) { if (!visited.has(nb)) stack.push(nb); }
    }
    if (borders.size === 1) { if (borders.has(BLACK)) bt += eg.length; else wt += eg.length; }
  }
  return { blackTerritory: bt, whiteTerritory: wt, blackStones: bs, whiteStones: ws };
};

export const evaluateForTsumego = (state: GoState, attacker: PlayerColor): number => {
  const t = countTerritory(state);
  const d = opponent(attacker);
  const aScore = (attacker === BLACK ? t.blackStones : t.whiteStones) + (attacker === BLACK ? t.blackTerritory : t.whiteTerritory) + (attacker === BLACK ? state.blackCaptured : state.whiteCaptured);
  const dScore = (d === BLACK ? t.blackStones : t.whiteStones) + (d === BLACK ? t.blackTerritory : t.whiteTerritory) + (d === BLACK ? state.blackCaptured : state.whiteCaptured);
  const aLib = countGroupLiberties(state, attacker);
  const dLib = countGroupLiberties(state, d);
  if (dLib === 0 && dScore > 0) return 1.0;
  if (aLib === 0) return 0.0;
  return Math.tanh((aScore - dScore + (aLib - dLib) * 0.5) / 10);
};

const countGroupLiberties = (state: GoState, color: PlayerColor): number => {
  const visited = new Set<number>();
  let total = 0;
  for (let i = 0; i < state.board.length; i++) {
    if (state.board[i] === color && !visited.has(i)) {
      const g = getGroup(state.board, i, state.size);
      g.stones.forEach(s => visited.add(s));
      total += g.liberties;
    }
  }
  return total;
};

