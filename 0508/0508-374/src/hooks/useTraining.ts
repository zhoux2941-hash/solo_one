import { useState, useCallback } from 'react';
import type { TrainingState } from '@/types';
import { getRandomChar } from '@/utils/morseCode';
import { saveStats, loadStats } from '@/utils/storage';

export function useTraining() {
  const [state, setState] = useState<TrainingState>(() => {
    const saved = loadStats();
    return {
      currentChar: '',
      currentMorse: '',
      userInput: '',
      isPlaying: false,
      score: 0,
      total: saved.total,
      correct: saved.correct,
      wrong: saved.wrong,
      successRate: saved.successRate,
      streak: 0,
      lastResult: null,
    };
  });

  const startNewRound = useCallback(() => {
    const { char, code } = getRandomChar();
    setState(prev => ({
      ...prev,
      currentChar: char,
      currentMorse: code,
      userInput: '',
      isPlaying: true,
      lastResult: null,
    }));
  }, []);

  const checkAnswer = useCallback((answer: string) => {
    const isCorrect = answer.toUpperCase() === state.currentChar;
    
    setState(prev => {
      const newTotal = prev.total + 1;
      const newCorrect = prev.correct + (isCorrect ? 1 : 0);
      const newWrong = prev.wrong + (isCorrect ? 0 : 1);
      const newSuccessRate = Math.round((newCorrect / newTotal) * 100);
      const newStreak = isCorrect ? prev.streak + 1 : 0;
      const newScore = prev.score + (isCorrect ? 10 : 0);
      
      const stats = { total: newTotal, correct: newCorrect, wrong: newWrong, successRate: newSuccessRate };
      saveStats(stats);
      
      return {
        ...prev,
        userInput: answer,
        isPlaying: false,
        total: newTotal,
        correct: newCorrect,
        wrong: newWrong,
        successRate: newSuccessRate,
        streak: newStreak,
        score: newScore,
        lastResult: isCorrect ? 'correct' : 'wrong',
      };
    });
  }, [state.currentChar]);

  const resetStats = useCallback(() => {
    saveStats({ total: 0, correct: 0, wrong: 0, successRate: 0 });
    setState(prev => ({
      ...prev,
      score: 0,
      total: 0,
      correct: 0,
      wrong: 0,
      successRate: 0,
      streak: 0,
      lastResult: null,
    }));
  }, []);

  const setPlaying = useCallback((playing: boolean) => {
    setState(prev => ({ ...prev, isPlaying: playing }));
  }, []);

  return {
    state,
    startNewRound,
    checkAnswer,
    resetStats,
    setPlaying,
  };
}
