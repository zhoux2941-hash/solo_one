import { useReducer, useCallback } from 'react';
import { GameState, GameAction, GameMode } from '../models/solarTerm';
import { generateQuestions, generatePracticeQuestion, checkAnswer } from '../services/questionService';
import { SOLAR_TERMS, TOTAL_QUESTIONS, CORRECT_SCORE, WRONG_SCORE } from '../data/solarTerms';

const initialState: GameState = {
  currentQuestionIndex: 0,
  totalQuestions: TOTAL_QUESTIONS,
  score: 0,
  questions: [],
  isGameOver: false,
  selectedAnswer: null,
  showFeedback: false,
  isCorrect: null,
  gameMode: 'exam',
  practiceSolarTermId: null,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      const { questions, gameMode, practiceSolarTermId } = action.payload;
      return {
        ...initialState,
        questions,
        gameMode,
        practiceSolarTermId: practiceSolarTermId ?? null,
        totalQuestions: gameMode === 'exam' ? TOTAL_QUESTIONS : 1,
      };
    }
    case 'SUBMIT_ANSWER': {
      const { answerId, isCorrect } = action.payload;
      const correctBool = isCorrect === 'true';
      const isPractice = state.gameMode === 'practice';

      if (isPractice) {
        return {
          ...state,
          selectedAnswer: answerId,
          showFeedback: true,
          isCorrect: correctBool,
        };
      }

      const scoreChange = correctBool ? CORRECT_SCORE : WRONG_SCORE;
      const isLastQuestion =
        state.currentQuestionIndex >= state.totalQuestions - 1;

      return {
        ...state,
        selectedAnswer: answerId,
        showFeedback: true,
        isCorrect: correctBool,
        score: state.score + scoreChange,
        isGameOver: isLastQuestion,
      };
    }
    case 'NEXT_QUESTION':
      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
        selectedAnswer: null,
        showFeedback: false,
        isCorrect: null,
      };
    case 'RESTART_GAME':
      return initialState;
    case 'PRACTICE_AGAIN':
      return {
        ...initialState,
        gameMode: 'practice',
        practiceSolarTermId: state.practiceSolarTermId,
      };
    default:
      return state;
  }
}

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const startExam = useCallback(() => {
    const questions = generateQuestions(SOLAR_TERMS, TOTAL_QUESTIONS);
    dispatch({ type: 'START_GAME', payload: { questions, gameMode: 'exam' } });
  }, []);

  const startPractice = useCallback((solarTermId: string) => {
    const term = SOLAR_TERMS.find((t) => t.id === solarTermId);
    if (!term) return;
    const question = generatePracticeQuestion(term);
    dispatch({
      type: 'START_GAME',
      payload: { questions: [question], gameMode: 'practice', practiceSolarTermId: solarTermId },
    });
  }, []);

  const submitAnswer = useCallback(
    (answerId: string) => {
      if (state.showFeedback || state.questions.length === 0) return;

      const currentQuestion = state.questions[state.currentQuestionIndex];
      if (!currentQuestion) return;

      const isCorrect = checkAnswer(currentQuestion, answerId);
      dispatch({
        type: 'SUBMIT_ANSWER',
        payload: { answerId, isCorrect: String(isCorrect) },
      });
    },
    [state.showFeedback, state.questions, state.currentQuestionIndex]
  );

  const nextQuestion = useCallback(() => {
    if (!state.showFeedback) return;
    if (state.gameMode === 'exam' && state.isGameOver) return;
    dispatch({ type: 'NEXT_QUESTION' });
  }, [state.showFeedback, state.gameMode, state.isGameOver]);

  const restartGame = useCallback(() => {
    dispatch({ type: 'RESTART_GAME' });
  }, []);

  const practiceAgain = useCallback(() => {
    dispatch({ type: 'PRACTICE_AGAIN' });
  }, []);

  const currentQuestion =
    state.questions[state.currentQuestionIndex] || null;

  return {
    state,
    currentQuestion,
    startExam,
    startPractice,
    submitAnswer,
    nextQuestion,
    restartGame,
    practiceAgain,
  };
}
