import { create } from 'zustand';
import { SieveState, Speed, NumberItem, MIN_N, MAX_N } from '@/types';
import { SieveEngine } from '@/utils/sieveEngine';

interface SieveStore extends SieveState {
  setN: (n: number) => void;
  setNumbers: (numbers: NumberItem[]) => void;
  setCurrentPrime: (p: number | null) => void;
  setIsRunning: (running: boolean) => void;
  setIsCompleted: (completed: boolean) => void;
  setSpeed: (speed: Speed) => void;
  setStepsCompleted: (steps: number) => void;
  setPrimeCount: (count: number) => void;
  setIsPaused: (paused: boolean) => void;
  reset: () => void;
  initialize: (n: number) => void;
}

const initialState: SieveState = {
  n: 100,
  numbers: [],
  currentPrime: null,
  isRunning: false,
  isCompleted: false,
  speed: 'medium',
  stepsCompleted: 0,
  totalSteps: 0,
  primeCount: 0,
  isPaused: false,
};

export const useSieveStore = create<SieveStore>((set, get) => ({
  ...initialState,

  setN: (n: number) => set({ n }),
  setNumbers: (numbers: NumberItem[]) => set({ numbers }),
  setCurrentPrime: (currentPrime: number | null) => set({ currentPrime }),
  setIsRunning: (isRunning: boolean) => set({ isRunning }),
  setIsCompleted: (isCompleted: boolean) => set({ isCompleted }),
  setSpeed: (speed: Speed) => set({ speed }),
  setStepsCompleted: (stepsCompleted: number) => set({ stepsCompleted }),
  setPrimeCount: (primeCount: number) => set({ primeCount }),
  setIsPaused: (isPaused: boolean) => set({ isPaused }),

  reset: () => {
    const { n } = get();
    const numbers = SieveEngine.generateNumbers(n);
    const totalSteps = SieveEngine.calculateTotalSteps(n);
    set({
      ...initialState,
      n,
      numbers,
      totalSteps,
    });
  },

  initialize: (n: number) => {
    if (!SieveEngine.validateN(n, MIN_N, MAX_N)) {
      return;
    }
    const numbers = SieveEngine.generateNumbers(n);
    const totalSteps = SieveEngine.calculateTotalSteps(n);
    set({
      ...initialState,
      n,
      numbers,
      totalSteps,
    });
  },
}));
