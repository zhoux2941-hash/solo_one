export type StoneColor = 'black' | 'white';

export type Category = 'corner' | 'edge' | 'center';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Stone {
  x: number;
  y: number;
  color: StoneColor;
}

export interface Move {
  x: number;
  y: number;
  color: StoneColor;
  order: number;
}

export interface Problem {
  id: string;
  title: string;
  category: Category;
  difficulty: Difficulty;
  boardSize: 9 | 13 | 19;
  description: string;
  initialStones: Stone[];
  playerColor: StoneColor;
}

export interface UserProgress {
  problemId: string;
  solved: boolean;
  attempts: number;
  bestTime: number;
  lastAttemptAt: string;
}

export interface BoardState {
  stones: Stone[];
  lastMove: { x: number; y: number } | null;
  playerMoves: Move[];
}

export type GameStatus = 'playing' | 'correct' | 'wrong' | 'showingAnswer';
