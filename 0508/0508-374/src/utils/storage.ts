export interface TrainingStats {
  total: number;
  correct: number;
  wrong: number;
  successRate: number;
}

const STORAGE_KEY = 'morse-trainer-stats';

export function saveStats(stats: TrainingStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save stats:', e);
  }
}

export function loadStats(): TrainingStats {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load stats:', e);
  }
  return { total: 0, correct: 0, wrong: 0, successRate: 0 };
}

export function clearStats(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear stats:', e);
  }
}
