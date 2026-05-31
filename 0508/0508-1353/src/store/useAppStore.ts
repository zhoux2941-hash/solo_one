import { create } from 'zustand';
import { GarbageRecord, DateRange, TypeStats, BuildingStats } from '../types';
import type { CorrectionRecord } from '../utils/csvParser';
import {
  filterRecordsByDateRange,
  calculateTypeStats,
  calculateBuildingStats,
} from '../utils/statistics';

interface AppState {
  records: GarbageRecord[];
  dateRange: DateRange;
  filteredRecords: GarbageRecord[];
  typeStats: TypeStats[];
  buildingStats: BuildingStats[];
  isLoading: boolean;
  error: string | null;
  fileName: string;
  corrections: CorrectionRecord[];

  setRecords: (records: GarbageRecord[], fileName: string, corrections?: CorrectionRecord[]) => void;
  setDateRange: (dateRange: DateRange) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearData: () => void;
}

const initialState: Omit<AppState, 'setRecords' | 'setDateRange' | 'setLoading' | 'setError' | 'clearData'> = {
  records: [],
  dateRange: { start: null, end: null },
  filteredRecords: [],
  typeStats: [],
  buildingStats: [],
  isLoading: false,
  error: null,
  fileName: '',
  corrections: [],
};

function calculateDerivedState(records: GarbageRecord[], dateRange: DateRange) {
  const filteredRecords = filterRecordsByDateRange(records, dateRange);
  const typeStats = calculateTypeStats(filteredRecords);
  const buildingStats = calculateBuildingStats(filteredRecords);
  return { filteredRecords, typeStats, buildingStats };
}

export const useAppStore = create<AppState>((set, get) => ({
  ...initialState,

  setRecords: (records: GarbageRecord[], fileName: string, corrections: CorrectionRecord[] = []) => {
    const { dateRange } = get();
    const derived = calculateDerivedState(records, dateRange);
    set({
      records,
      fileName,
      corrections,
      ...derived,
    });
  },

  setDateRange: (dateRange: DateRange) => {
    const { records } = get();
    const derived = calculateDerivedState(records, dateRange);
    set({
      dateRange,
      ...derived,
    });
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  setError: (error: string | null) => set({ error }),

  clearData: () => set(initialState),
}));
