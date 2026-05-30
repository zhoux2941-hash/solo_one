export type StoneColor = 'black' | 'white' | null;

export interface Position {
  x: number;
  y: number;
}

export interface Move {
  position: Position;
  color: StoneColor;
  timestamp: number;
  moveNumber: number;
}

export interface Game {
  id: string;
  title: string;
  blackPlayer: string;
  whitePlayer: string;
  date: string;
  result: string;
  moves: Move[];
  createdAt: number;
}

export interface Opening {
  id: number;
  name: string;
  moveSequence: Position[];
  winRate: number;
  description: string;
}

export interface WinRateData {
  moveNumber: number;
  blackWinRate: number;
  whiteWinRate: number;
}

export interface AISuggestion {
  position: Position;
  name: string;
  winRate: number;
  description: string;
}

export const BOARD_SIZE = 17;
