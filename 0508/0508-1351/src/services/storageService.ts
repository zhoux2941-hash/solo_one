import { PracticeRecords } from '../models/solarTerm';

const STORAGE_KEY = 'solar-term-practice-records';

export function loadPracticeRecords(): PracticeRecords {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as PracticeRecords;
  } catch {
    return {};
  }
}

export function savePracticeRecords(records: PracticeRecords): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // silently fail
  }
}

export function updatePracticeRecord(
  records: PracticeRecords,
  solarTermId: string,
  isCorrect: boolean
): PracticeRecords {
  const existing = records[solarTermId] || {
    solarTermId,
    practiceCount: 0,
    correctCount: 0,
  };

  const updated: PracticeRecords = {
    ...records,
    [solarTermId]: {
      solarTermId,
      practiceCount: existing.practiceCount + 1,
      correctCount: existing.correctCount + (isCorrect ? 1 : 0),
    },
  };

  savePracticeRecords(updated);
  return updated;
}
