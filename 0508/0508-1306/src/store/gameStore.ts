import { create } from 'zustand';
import { Move, Game, Position, StoneColor, BOARD_SIZE, AISuggestion } from '../../shared/types';
import { calculateWinRate } from '../utils/winRate';

interface GameState {
  game: Game;
  currentPlayer: StoneColor;
  board: StoneColor[][];
  lastMove: Position | null;
  aiSuggestions: AISuggestion[];
  showSuggestions: boolean;
  isGameOver: boolean;
  gameHistory: Game[];
  
  newGame: (blackPlayer?: string, whitePlayer?: string) => void;
  makeMove: (position: Position) => boolean;
  undoMove: () => void;
  toggleSuggestions: () => void;
  setSuggestions: (suggestions: AISuggestion[]) => void;
  loadGame: (game: Game) => void;
  setGameOver: (result: string) => void;
  updateTitle: (title: string) => void;
  updatePlayers: (black: string, white: string) => void;
  fetchGameHistory: () => Promise<void>;
}

function createEmptyBoard(): StoneColor[][] {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
}

function buildBoardFromMoves(moves: Move[]): StoneColor[][] {
  const board = createEmptyBoard();
  moves.forEach((move) => {
    if (move.position.x >= 0 && move.position.x < BOARD_SIZE && 
        move.position.y >= 0 && move.position.y < BOARD_SIZE) {
      board[move.position.y][move.position.x] = move.color;
    }
  });
  return board;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export const useGameStore = create<GameState>((set, get) => ({
  game: {
    id: generateId(),
    title: '新对局',
    blackPlayer: '黑方',
    whitePlayer: '白方',
    date: new Date().toISOString().split('T')[0],
    result: '',
    moves: [],
    createdAt: Date.now(),
  },
  currentPlayer: 'black',
  board: createEmptyBoard(),
  lastMove: null,
  aiSuggestions: [],
  showSuggestions: false,
  isGameOver: false,
  gameHistory: [],

  newGame: (blackPlayer = '黑方', whitePlayer = '白方') => {
    set({
      game: {
        id: generateId(),
        title: '新对局',
        blackPlayer,
        whitePlayer,
        date: new Date().toISOString().split('T')[0],
        result: '',
        moves: [],
        createdAt: Date.now(),
      },
      currentPlayer: 'black',
      board: createEmptyBoard(),
      lastMove: null,
      aiSuggestions: [],
      isGameOver: false,
    });
  },

  makeMove: (position: Position) => {
    const state = get();
    
    if (state.isGameOver) return false;
    if (state.board[position.y][position.x] !== null) return false;
    
    const newMove: Move = {
      position,
      color: state.currentPlayer,
      timestamp: Date.now(),
      moveNumber: state.game.moves.length + 1,
    };
    
    const newMoves = [...state.game.moves, newMove];
    const newBoard = buildBoardFromMoves(newMoves);
    const nextPlayer = state.currentPlayer === 'black' ? 'white' : 'black';
    
    set({
      game: {
        ...state.game,
        moves: newMoves,
      },
      board: newBoard,
      currentPlayer: nextPlayer,
      lastMove: position,
    });
    
    return true;
  },

  undoMove: () => {
    const state = get();
    if (state.game.moves.length === 0) return;
    
    const newMoves = state.game.moves.slice(0, -1);
    const newBoard = buildBoardFromMoves(newMoves);
    const lastMove = newMoves.length > 0 ? newMoves[newMoves.length - 1].position : null;
    const previousPlayer = state.game.moves[state.game.moves.length - 1].color;
    
    set({
      game: {
        ...state.game,
        moves: newMoves,
      },
      board: newBoard,
      currentPlayer: previousPlayer,
      lastMove,
      isGameOver: false,
    });
  },

  toggleSuggestions: () => {
    set((state) => ({ showSuggestions: !state.showSuggestions }));
  },

  setSuggestions: (suggestions: AISuggestion[]) => {
    set({ aiSuggestions: suggestions });
  },

  loadGame: (game: Game) => {
    const newBoard = buildBoardFromMoves(game.moves);
    const lastMove = game.moves.length > 0 ? game.moves[game.moves.length - 1].position : null;
    const currentPlayer = game.moves.length % 2 === 0 ? 'black' : 'white';
    
    set({
      game,
      board: newBoard,
      currentPlayer,
      lastMove,
      isGameOver: game.result !== '',
      aiSuggestions: [],
    });
  },

  setGameOver: (result: string) => {
    const state = get();
    set({
      game: {
        ...state.game,
        result,
      },
      isGameOver: true,
    });
  },

  updateTitle: (title: string) => {
    const state = get();
    set({
      game: {
        ...state.game,
        title,
      },
    });
  },

  updatePlayers: (black: string, white: string) => {
    const state = get();
    set({
      game: {
        ...state.game,
        blackPlayer: black,
        whitePlayer: white,
      },
    });
  },

  fetchGameHistory: async () => {
    try {
      const response = await fetch('/api/games');
      if (response.ok) {
        const games = await response.json();
        set({ gameHistory: games });
      }
    } catch (error) {
      console.error('Failed to fetch game history:', error);
    }
  },
}));
