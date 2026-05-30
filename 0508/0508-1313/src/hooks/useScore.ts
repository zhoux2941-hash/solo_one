import { useState, useEffect, useCallback } from 'react';
import type { ScoreState } from '../types';

const STORAGE_KEY = 'abacus-score';

export const useScore = () => {
  const [scoreState, setScoreState] = useState<ScoreState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fall through
        }
      }
    }
    return {
      total: 0,
      correct: 0,
      currentProblemId: null,
      completedProblems: [],
    };
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scoreState));
    }
  }, [scoreState]);

  const addCorrect = useCallback(() => {
    setScoreState(prev => ({
      ...prev,
      total: prev.total + 1,
      correct: prev.correct + 1,
    }));
  }, []);

  const addWrong = useCallback(() => {
    setScoreState(prev => ({
      ...prev,
      total: prev.total + 1,
    }));
  }, []);

  const setCurrentProblem = useCallback((id: number | null) => {
    setScoreState(prev => ({ ...prev, currentProblemId: id }));
  }, []);

  const markCompleted = useCallback((id: number) => {
    setScoreState(prev => {
      if (prev.completedProblems.includes(id)) return prev;
      return {
        ...prev,
        completedProblems: [...prev.completedProblems, id],
      };
    });
  }, []);

  const isCompleted = useCallback((id: number) => {
    return scoreState.completedProblems.includes(id);
  }, [scoreState.completedProblems]);

  const resetScore = useCallback(() => {
    setScoreState({
      total: 0,
      correct: 0,
      currentProblemId: null,
      completedProblems: [],
    });
  }, []);

  const accuracy = scoreState.total > 0 ? Math.round((scoreState.correct / scoreState.total) * 100) : 0;

  return {
    scoreState,
    addCorrect,
    addWrong,
    setCurrentProblem,
    markCompleted,
    isCompleted,
    resetScore,
    accuracy,
  };
};
