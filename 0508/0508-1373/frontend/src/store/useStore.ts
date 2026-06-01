import { create } from 'zustand';
import type {
  LoadTest,
  AggregatedMetrics,
  WorkerStatus,
  ABTestResult,
} from '../types';

interface StoreState {
  tests: LoadTest[];
  abTests: ABTestResult[];
  metrics: Record<string, AggregatedMetrics[]>;
  workerStatuses: Record<string, WorkerStatus>;
  selectedTestId: string | null;
  isConnected: boolean;

  setTests: (tests: LoadTest[]) => void;
  addTest: (test: LoadTest) => void;
  updateTest: (test: LoadTest) => void;
  setSelectedTestId: (id: string | null) => void;

  addMetrics: (metrics: AggregatedMetrics) => void;
  updateWorkerStatus: (status: WorkerStatus) => void;

  addABTest: (abTest: ABTestResult) => void;
  updateABTest: (abTest: ABTestResult) => void;
  setABTests: (tests: ABTestResult[]) => void;

  setIsConnected: (connected: boolean) => void;
}

export const useStore = create<StoreState>((set) => ({
  tests: [],
  abTests: [],
  metrics: {},
  workerStatuses: {},
  selectedTestId: null,
  isConnected: false,

  setTests: (tests) => set({ tests }),
  addTest: (test) =>
    set((state) => ({
      tests: [test, ...state.tests],
    })),
  updateTest: (test) =>
    set((state) => ({
      tests: state.tests.map((t) => (t.id === test.id ? test : t)),
    })),
  setSelectedTestId: (id) => set({ selectedTestId: id }),

  addMetrics: (metrics) =>
    set((state) => {
      const existing = state.metrics[metrics.test_id] || [];
      const updated = [...existing, metrics].slice(-100);
      return {
        metrics: {
          ...state.metrics,
          [metrics.test_id]: updated,
        },
      };
    }),
  updateWorkerStatus: (status) =>
    set((state) => ({
      workerStatuses: {
        ...state.workerStatuses,
        [status.id]: status,
      },
    })),

  addABTest: (abTest) =>
    set((state) => ({
      abTests: [abTest, ...state.abTests],
    })),
  updateABTest: (abTest) =>
    set((state) => ({
      abTests: state.abTests.map((t) => (t.id === abTest.id ? abTest : t)),
    })),
  setABTests: (tests) => set({ abTests: tests }),

  setIsConnected: (connected) => set({ isConnected: connected }),
}));
