import { useState, useCallback } from 'react';
import { PracticeRecords } from '../models/solarTerm';
import { loadPracticeRecords, updatePracticeRecord } from '../services/storageService';

export function usePracticeRecords() {
  const [records, setRecords] = useState<PracticeRecords>(() => loadPracticeRecords());

  const recordAnswer = useCallback((solarTermId: string, isCorrect: boolean) => {
    setRecords((prev) => updatePracticeRecord(prev, solarTermId, isCorrect));
  }, []);

  const getRecord = useCallback(
    (solarTermId: string) => {
      return records[solarTermId] || { solarTermId, practiceCount: 0, correctCount: 0 };
    },
    [records]
  );

  const getAccuracy = useCallback(
    (solarTermId: string) => {
      const record = getRecord(solarTermId);
      if (record.practiceCount === 0) return 0;
      return Math.round((record.correctCount / record.practiceCount) * 100);
    },
    [getRecord]
  );

  return { records, recordAnswer, getRecord, getAccuracy };
}
