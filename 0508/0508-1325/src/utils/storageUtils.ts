import { HIGH_SCORE_KEY } from '@/config/gameConfig';

export function getHighScore(): number {
  try {
    const stored = localStorage.getItem(HIGH_SCORE_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

export function saveHighScore(score: number): void {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, score.toString());
  } catch {
    console.error('Failed to save high score');
  }
}

export function updateHighScoreIfNeeded(newScore: number): number {
  const currentHigh = getHighScore();
  if (newScore > currentHigh) {
    saveHighScore(newScore);
    return newScore;
  }
  return currentHigh;
}
