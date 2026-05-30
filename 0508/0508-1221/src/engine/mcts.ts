import {
  GoState,
  PlayerColor,
  playMove,
  pass,
  getLegalMoves,
  isGameOver,
  evaluateForTsumego,
  cloneState,
  opponent,
  toCoord,
  toIndex,
} from './goGame';

class MCTSNode {
  state: GoState;
  parent: MCTSNode | null;
  move: number | null;
  children: MCTSNode[];
  visits: number;
  wins: number;
  untriedMoves: number[];

  constructor(state: GoState, parent: MCTSNode | null = null, move: number | null = null) {
    this.state = state;
    this.parent = parent;
    this.move = move;
    this.children = [];
    this.visits = 0;
    this.wins = 0;
    this.untriedMoves = getLegalMoves(state);
  }
}

interface MCTSConfig {
  iterations: number;
  maxDepth: number;
  explorationConstant: number;
}

function getMCTSConfig(difficulty: 'beginner' | 'intermediate' | 'advanced'): MCTSConfig {
  switch (difficulty) {
    case 'beginner':
      return { iterations: 200, maxDepth: 6, explorationConstant: 1.414 };
    case 'intermediate':
      return { iterations: 500, maxDepth: 10, explorationConstant: 1.414 };
    case 'advanced':
      return { iterations: 1000, maxDepth: 15, explorationConstant: 1.414 };
  }
}

function select(node: MCTSNode, explorationConstant: number): MCTSNode {
  let current = node;
  while (current.children.length > 0 && current.untriedMoves.length === 0) {
    let bestChild = current.children[0];
    let bestUCB1 = -Infinity;
    for (const child of current.children) {
      const exploit = child.wins / child.visits;
      const explore = explorationConstant * Math.sqrt(Math.log(current.visits) / child.visits);
      const ucb1 = exploit + explore;
      if (ucb1 > bestUCB1) {
        bestUCB1 = ucb1;
        bestChild = child;
      }
    }
    current = bestChild;
  }
  return current;
}

function expand(node: MCTSNode): MCTSNode {
  if (node.untriedMoves.length === 0) return node;
  const index = Math.floor(Math.random() * node.untriedMoves.length);
  const move = node.untriedMoves.splice(index, 1)[0];
  const newState = cloneState(node.state);
  playMove(newState, move);
  const child = new MCTSNode(newState, node, move);
  node.children.push(child);
  return child;
}

function simulate(state: GoState, attacker: PlayerColor, maxDepth: number): number {
  const simState = cloneState(state);
  let depth = 0;
  while (!isGameOver(simState) && depth < maxDepth) {
    const moves = getLegalMoves(simState);
    if (moves.length === 0) {
      pass(simState);
    } else {
      const move = moves[Math.floor(Math.random() * moves.length)];
      playMove(simState, move);
    }
    depth++;
  }
  return evaluateForTsumego(simState, attacker);
}

function backpropagate(node: MCTSNode, result: number): void {
  let current: MCTSNode | null = node;
  while (current !== null) {
    current.visits += 1;
    current.wins += result;
    current = current.parent;
  }
}

function mctsSearch(state: GoState, attacker: PlayerColor, config: MCTSConfig): number | null {
  const root = new MCTSNode(cloneState(state));
  for (let i = 0; i < config.iterations; i++) {
    let node = select(root, config.explorationConstant);
    if (node.untriedMoves.length > 0) {
      node = expand(node);
    }
    const result = simulate(node.state, attacker, config.maxDepth);
    backpropagate(node, result);
  }
  if (root.children.length === 0) return null;
  let bestChild = root.children[0];
  for (const child of root.children) {
    if (child.visits > bestChild.visits) {
      bestChild = child;
    }
  }
  return bestChild.move;
}

function getBestMoveAndAlternatives(
  state: GoState,
  attacker: PlayerColor,
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): { bestMove: number | null; hintMove: number | null; alternativeMoves: number[]; winRate: number } {
  const config = getMCTSConfig(difficulty);
  const root = new MCTSNode(cloneState(state));
  for (let i = 0; i < config.iterations; i++) {
    let node = select(root, config.explorationConstant);
    if (node.untriedMoves.length > 0) {
      node = expand(node);
    }
    const result = simulate(node.state, attacker, config.maxDepth);
    backpropagate(node, result);
  }
  if (root.children.length === 0) {
    return { bestMove: null, hintMove: null, alternativeMoves: [], winRate: 0 };
  }
  const sorted = [...root.children].sort((a, b) => b.visits - a.visits);
  const bestChild = sorted[0];
  const hintChild = sorted.length > 1 ? sorted[1] : null;
  const alternativeMoves = sorted.slice(1, 4).map(c => c.move!).filter(m => m !== null);
  const winRate = bestChild.visits > 0 ? bestChild.wins / bestChild.visits : 0;
  return {
    bestMove: bestChild.move,
    hintMove: hintChild ? hintChild.move : null,
    alternativeMoves,
    winRate,
  };
}

function generateRefSequence(
  state: GoState,
  attacker: PlayerColor,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  maxMoves: number = 5
): { x: number; y: number; color: PlayerColor; order: number }[] {
  const config = getMCTSConfig(difficulty);
  const sequence: { x: number; y: number; color: PlayerColor; order: number }[] = [];
  let currentState = cloneState(state);
  let currentAttacker = attacker;
  for (let i = 0; i < maxMoves; i++) {
    const bestMove = mctsSearch(currentState, currentAttacker, config);
    if (bestMove === null) break;
    const coord = toCoord(bestMove);
    sequence.push({
      x: coord.x,
      y: coord.y,
      color: currentAttacker,
      order: i + 1,
    });
    playMove(currentState, bestMove);
    currentAttacker = opponent(currentAttacker);
  }
  return sequence;
}

export {
  MCTSNode,
  MCTSConfig,
  getMCTSConfig,
  select,
  expand,
  simulate,
  backpropagate,
  mctsSearch,
  getBestMoveAndAlternatives,
  generateRefSequence,
};
