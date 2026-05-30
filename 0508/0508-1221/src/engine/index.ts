import { GoState, PlayerColor, BLACK, WHITE, createGoState, toCoord } from './goGame';
import { getBestMoveAndAlternatives, generateRefSequence } from './mcts';

interface SolveResult {
  bestMove: { x: number; y: number } | null;
  hintMove: { x: number; y: number } | null;
  alternativeMoves: { x: number; y: number }[];
  winRate: number;
}

interface RefAnswer {
  moves: { x: number; y: number; color: 'black' | 'white'; order: number }[];
}

const colorToPlayer = (c: 'black' | 'white'): PlayerColor => c === 'black' ? BLACK : WHITE;

const playerToColor = (p: PlayerColor): 'black' | 'white' => p === BLACK ? 'black' : 'white';

export const solveProblem = (
  size: number,
  initialStones: { x: number; y: number; color: 'black' | 'white' }[],
  playerColor: 'black' | 'white',
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): SolveResult => {
  const state = createGoState(size, initialStones);
  const attacker = colorToPlayer(playerColor);
  const result = getBestMoveAndAlternatives(state, attacker, difficulty);
  return {
    bestMove: result.bestMove !== null ? toCoord(result.bestMove, size) : null,
    hintMove: result.hintMove !== null ? toCoord(result.hintMove, size) : null,
    alternativeMoves: result.alternativeMoves.filter(m => m !== null).map(m => toCoord(m, size)),
    winRate: result.winRate,
  };
};

export const getRefAnswer = (
  size: number,
  initialStones: { x: number; y: number; color: 'black' | 'white' }[],
  playerColor: 'black' | 'white',
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  maxMoves: number = 5
): RefAnswer => {
  const state = createGoState(size, initialStones);
  const attacker = colorToPlayer(playerColor);
  const sequence = generateRefSequence(state, attacker, difficulty, maxMoves);
  return {
    moves: sequence.map(m => ({ ...m, color: playerColor })),
  };
};

export const checkPlayerMove = (
  size: number,
  initialStones: { x: number; y: number; color: 'black' | 'white' }[],
  playerColor: 'black' | 'white',
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  playerMoves: { x: number; y: number }[]
): boolean => {
  const result = solveProblem(size, initialStones, playerColor, difficulty);
  if (!result.bestMove) return false;
  return playerMoves.some(m => m.x === result.bestMove.x && m.y === result.bestMove.y);
};

export type { SolveResult, RefAnswer };
