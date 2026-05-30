import { create } from 'zustand';
import { SelectedSpice, IncenseState, Spice, FormulaAnalysis } from '../types';
import { analyzeFormula } from '../utils/formulaAnalyzer';
import { calculateReleaseRate, getAshColor, updateAshParticles } from '../utils/incenseSimulator';

interface IncenseStore {
  selectedSpices: SelectedSpice[];
  formulaName: string;
  incenseState: IncenseState;
  analysis: FormulaAnalysis | null;
  addSpice: (spice: Spice, grams: number) => void;
  removeSpice: (spiceId: string) => void;
  updateSpiceGrams: (spiceId: string, grams: number) => void;
  clearFormula: () => void;
  setFormulaName: (name: string) => void;
  setTemperature: (temp: number) => void;
  setGrindLevel: (level: number) => void;
  startBurning: () => void;
  stopBurning: () => void;
  resetBurning: () => void;
  tick: (canvasWidth: number) => void;
  loadFormula: (spices: SelectedSpice[], name: string) => void;
  isSpiceSelected: (spiceId: string) => boolean;
}

export const useIncenseStore = create<IncenseStore>((set, get) => ({
  selectedSpices: [],
  formulaName: '自定义香方',
  incenseState: {
    temperature: 150,
    releaseRate: calculateReleaseRate(150, 5),
    burnTime: 0,
    ashColor: { r: 200, g: 200, b: 200 },
    isBurning: false,
    ashParticles: [],
    grindLevel: 5,
  },
  analysis: null,

  isSpiceSelected: (spiceId: string) => {
    return get().selectedSpices.some((s) => s.spice.id === spiceId);
  },

  addSpice: (spice: Spice, grams: number) => {
    set((state) => {
      const existing = state.selectedSpices.find((s) => s.spice.id === spice.id);
      let newSelected: SelectedSpice[];

      if (existing) {
        newSelected = state.selectedSpices.map((s) =>
          s.spice.id === spice.id ? { ...s, grams: s.grams + grams } : s
        );
      } else {
        newSelected = [...state.selectedSpices, { spice, grams }];
      }

      return {
        selectedSpices: newSelected,
        analysis: analyzeFormula(newSelected),
      };
    });
  },

  removeSpice: (spiceId: string) => {
    set((state) => {
      const newSelected = state.selectedSpices.filter((s) => s.spice.id !== spiceId);
      return {
        selectedSpices: newSelected,
        analysis: analyzeFormula(newSelected),
      };
    });
  },

  updateSpiceGrams: (spiceId: string, grams: number) => {
    set((state) => {
      const newSelected = state.selectedSpices.map((s) =>
        s.spice.id === spiceId ? { ...s, grams: Math.max(0, grams) } : s
      ).filter((s) => s.grams > 0);

      return {
        selectedSpices: newSelected,
        analysis: analyzeFormula(newSelected),
      };
    });
  },

  clearFormula: () => {
    set({
      selectedSpices: [],
      analysis: null,
      formulaName: '自定义香方',
    });
  },

  setFormulaName: (name: string) => {
    set({ formulaName: name || '自定义香方' });
  },

  setTemperature: (temp: number) => {
    const clampedTemp = Math.max(120, Math.min(200, temp));
    set((state) => ({
      incenseState: {
        ...state.incenseState,
        temperature: clampedTemp,
        releaseRate: calculateReleaseRate(clampedTemp, state.incenseState.grindLevel),
        ashColor: getAshColor(state.incenseState.burnTime, clampedTemp),
      },
    }));
  },

  setGrindLevel: (level: number) => {
    const clampedLevel = Math.max(1, Math.min(10, level));
    set((state) => ({
      incenseState: {
        ...state.incenseState,
        grindLevel: clampedLevel,
        releaseRate: calculateReleaseRate(state.incenseState.temperature, clampedLevel),
      },
    }));
  },

  startBurning: () => {
    set((state) => ({
      incenseState: {
        ...state.incenseState,
        isBurning: true,
      },
    }));
  },

  stopBurning: () => {
    set((state) => ({
      incenseState: {
        ...state.incenseState,
        isBurning: false,
      },
    }));
  },

  resetBurning: () => {
    set({
      incenseState: {
        temperature: 150,
        releaseRate: calculateReleaseRate(150, 5),
        burnTime: 0,
        ashColor: { r: 200, g: 200, b: 200 },
        isBurning: false,
        ashParticles: [],
        grindLevel: 5,
      },
    });
  },

  tick: (canvasWidth: number) => {
    set((state) => {
      if (!state.incenseState.isBurning) return state;

      const newBurnTime = state.incenseState.burnTime + 0.05;
      const newParticles = updateAshParticles(
        state.incenseState.ashParticles,
        state.incenseState.temperature,
        state.incenseState.isBurning,
        canvasWidth,
        newBurnTime,
        state.incenseState.grindLevel
      );

      return {
        incenseState: {
          ...state.incenseState,
          burnTime: newBurnTime,
          ashColor: getAshColor(newBurnTime, state.incenseState.temperature),
          ashParticles: newParticles,
        },
      };
    });
  },

  loadFormula: (spices: SelectedSpice[], name: string) => {
    set({
      selectedSpices: spices,
      formulaName: name,
      analysis: analyzeFormula(spices),
    });
  },
}));
