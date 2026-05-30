import { create } from 'zustand';
import { GAME_CONFIG } from '@/config/gameConfig';
import { GameState, GameActions, ThrowResult, Position } from '@/types/game';
import { getHighScore, updateHighScoreIfNeeded } from '@/utils/storageUtils';
import { getRandomBasketYPosition } from '@/utils/gameUtils';

type GameStore = GameState & GameActions;

const initialBasketY = getRandomBasketYPosition();

const initialState: GameState = {
  status: 'idle',
  currentRound: 0,
  totalRounds: GAME_CONFIG.totalRounds,
  currentScore: 0,
  throwResults: [],
  highScore: 0,
  basketPosition: 50,
  basketYPosition: initialBasketY.y,
  ballPosition: null,
  isBallFlying: false,
  scorePopup: null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  startGame: () => {
    const newBasketY = getRandomBasketYPosition();
    set({
      status: 'playing',
      currentRound: 1,
      currentScore: 0,
      throwResults: [],
      highScore: getHighScore(),
      ballPosition: null,
      isBallFlying: false,
      scorePopup: null,
      basketYPosition: newBasketY.y,
    });
  },

  throwBall: () => {
    const state = get();
    if (state.status !== 'playing') return;
    if (state.isBallFlying) return;
    
    set({ isBallFlying: true, status: 'throwing' });
  },

  resetGame: () => {
    const newBasketY = getRandomBasketYPosition();
    set({
      ...initialState,
      highScore: getHighScore(),
      basketYPosition: newBasketY.y,
    });
  },

  updateBasketPosition: (pos: number) => {
    set({ basketPosition: pos });
  },

  updateBasketYPosition: (pos: number) => {
    set({ basketYPosition: pos });
  },

  updateBallPosition: (pos: Position | null) => {
    set({ ballPosition: pos });
  },

  setScorePopup: (popup: { score: number; position: Position } | null) => {
    set({ scorePopup: popup });
  },
}));

export function completeThrow(result: ThrowResult, ballPosition: Position) {
  const state = useGameStore.getState();
  const newScore = state.currentScore + result.score;
  const newResults = [...state.throwResults, result];
  const newRound = state.currentRound + 1;
  const isFinished = newRound > state.totalRounds;
  
  const newHighScore = isFinished ? updateHighScoreIfNeeded(newScore) : state.highScore;
  const newBasketY = !isFinished ? getRandomBasketYPosition() : null;
  
  useGameStore.setState({
    currentScore: newScore,
    throwResults: newResults,
    isBallFlying: false,
    ballPosition: null,
    scorePopup: result.score > 0 ? { score: result.score, position: ballPosition } : null,
    status: isFinished ? 'finished' : 'playing',
    currentRound: isFinished ? state.currentRound : newRound,
    highScore: newHighScore,
    basketYPosition: newBasketY ? newBasketY.y : state.basketYPosition,
  });
}
