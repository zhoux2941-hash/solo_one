import { create } from 'zustand';
import { Problem, Stone, Move, GameStatus, UserProgress, Category, StoneColor } from '@/types';
import { problems } from '@/data/problems';
import { solveProblem, getRefAnswer, checkPlayerMove } from '@/engine';
import type { SolveResult, RefAnswer } from '@/engine';

interface GameState {
  currentProblemId: string | null;
  boardStones: Stone[];
  playerMoves: Move[];
  lastMove: { x: number; y: number } | null;
  gameStatus: GameStatus;
  showHints: boolean;
  showAnswer: boolean;
  elapsedTime: number;
  attempts: number;
  progress: Record<string, UserProgress>;
  selectedCategory: Category | 'all';
  currentProblem: Problem | null;
  solveResult: SolveResult | null;
  refAnswer: RefAnswer | null;
  hintPoints: { x: number; y: number }[];
  refMoves: { x: number; y: number; color: StoneColor; order: number }[];

  setCurrentProblem: (id: string) => void;
  resetBoard: () => void;
  placeStone: (x: number, y: number) => boolean;
  checkAnswer: () => void;
  toggleHints: () => void;
  toggleAnswer: () => void;
  incrementTime: () => void;
  setSelectedCategory: (category: Category | 'all') => void;
  goToNextProblem: () => void;
  goToPrevProblem: () => void;
}

const STORAGE_KEY = 'go-tsumego-progress';

const loadProgress = (): Record<string, UserProgress> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const saveProgress = (progress: Record<string, UserProgress>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {}
};

const runSolve = (problem: Problem): SolveResult => {
  return solveProblem(
    problem.boardSize,
    problem.initialStones,
    problem.playerColor,
    problem.difficulty
  );
};

const runRefAnswer = (problem: Problem): RefAnswer => {
  return getRefAnswer(
    problem.boardSize,
    problem.initialStones,
    problem.playerColor,
    problem.difficulty
  );
};

export const useGameStore = create<GameState>((set, get) => ({
  currentProblemId: null,
  boardStones: [],
  playerMoves: [],
  lastMove: null,
  gameStatus: 'playing',
  showHints: false,
  showAnswer: false,
  elapsedTime: 0,
  attempts: 0,
  progress: loadProgress(),
  selectedCategory: 'all',
  currentProblem: null,
  solveResult: null,
  refAnswer: null,
  hintPoints: [],
  refMoves: [],

  setCurrentProblem: (id: string) => {
    const problem = problems.find(p => p.id === id);
    if (!problem) return;
    const solved = runSolve(problem);
    const ref = runRefAnswer(problem);
    set({
      currentProblemId: id,
      currentProblem: problem,
      boardStones: [...problem.initialStones],
      playerMoves: [],
      lastMove: null,
      gameStatus: 'playing',
      showHints: false,
      showAnswer: false,
      elapsedTime: 0,
      attempts: 0,
      solveResult: solved,
      refAnswer: ref,
      hintPoints: solved.hintMove ? [solved.hintMove] : solved.alternativeMoves,
      refMoves: ref.moves,
    });
  },

  resetBoard: () => {
    const { currentProblem } = get();
    if (!currentProblem) return;
    set({
      boardStones: [...currentProblem.initialStones],
      playerMoves: [],
      lastMove: null,
      gameStatus: 'playing',
      showHints: false,
      showAnswer: false,
    });
  },

  placeStone: (x: number, y: number) => {
    const { currentProblem, boardStones, playerMoves, gameStatus } = get();
    if (!currentProblem || gameStatus !== 'playing') return false;
    const hasStone = boardStones.some(s => s.x === x && s.y === y);
    if (hasStone) return false;
    const newMove: Move = { x, y, color: currentProblem.playerColor, order: playerMoves.length + 1 };
    set({
      boardStones: [...boardStones, { x, y, color: currentProblem.playerColor }],
      playerMoves: [...playerMoves, newMove],
      lastMove: { x, y },
    });
    return true;
  },

  checkAnswer: () => {
    const { currentProblem, playerMoves, attempts, progress, currentProblemId, elapsedTime } = get();
    if (!currentProblem || !currentProblemId || playerMoves.length === 0) return;
    const isCorrect = checkPlayerMove(
      currentProblem.boardSize,
      currentProblem.initialStones,
      currentProblem.playerColor,
      currentProblem.difficulty,
      playerMoves
    );
    const newAttempts = attempts + 1;
    const currentProgress = progress[currentProblemId] || {
      problemId: currentProblemId,
      solved: false,
      attempts: 0,
      bestTime: Infinity,
      lastAttemptAt: '',
    };
    const newProgress = {
      ...progress,
      [currentProblemId]: {
        ...currentProgress,
        solved: isCorrect || currentProgress.solved,
        attempts: currentProgress.attempts + 1,
        bestTime: isCorrect ? Math.min(currentProgress.bestTime, elapsedTime) : currentProgress.bestTime,
        lastAttemptAt: new Date().toISOSTring(),
      },
    };
    saveProgress(newProgress);
    set({
      gameStatus: isCorrect 	��ܜ�X�	��	�ܛۙ��][\Έ�]�][\����ܙ\�Έ�]���ܙ\���JNK�����R[�Έ

HO��]
�]HO�
����[�Έ\�]K����[��JJNK�����P[���\��

HO��]
�]HO�
����[���\��\�]K����[���\�JJNK��[�ܙ[Y[�[YN�

HO��]
�]HO��[\�Y[YN��]K�[\�Y[YH
�HJNK���]�[X�Y�]Y�ܞN�
�]Y�ܞN��]Y�ܞH	�[	�HO��]
��[X�Y�]Y�ܞN��]Y�ܞHJNK����ә^�؛[N�

HO��ۜ���\��[��؛[RY�[X�Y�]Y�ܞHHH�]

N�ۜ��[\�Y�؛[\�H�[X�Y�]Y�ܞHOOH	�[	��؛[\��؛[\˙�[\�O���]Y�ܞHOOH�[X�Y�]Y�ܞJN�ۜ��\��[�[�^H�[\�Y�؛[\˙�[�[�^
O��YOOH�\��[��؛[RY
NY�
�\��[�[�^�[\�Y�؛[\˛[��HJH�]

K��]�\��[��؛[J�[\�Y�؛[\���\��[�[�^
�WK�Y
NB�K������]��؛[N�

HO��ۜ���\��[��؛[RY�[X�Y�]Y�ܞHHH�]

N�ۜ��[\�Y�؛[\�H�[X�Y�]Y�ܞHOOH	�[	��؛[\��؛[\˙�[\�O���]Y�ܞHOOH�[X�Y�]Y�ܞJN�ۜ��\��[�[�^H�[\�Y�؛[\˙�[�[�^
O��YOOH�\��[��؛[RY
NY�
�\��[�[�^�
H�]

K��]�\��[��؛[J�[\�Y�؛[\���\��[�[�^HWK�Y
NB�K�JJN�