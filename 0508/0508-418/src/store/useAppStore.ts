import { create } from 'zustand';
import { Gender, VowelData } from '@/types';
import { VOWELS } from '@/data/vowels';
import { getF1Frequency, getF2Frequency } from '@/utils/acoustics';

export interface HistoryPoint {
  vowelId: string;
  ipa: string;
  exampleWord: string;
  f1: number;
  f2: number;
  gender: Gender;
  timestamp: number;
}

interface AppState {
  selectedVowelId: string;
  gender: Gender;
  overlayMode: boolean;
  historyPoints: HistoryPoint[];
  setSelectedVowelId: (id: string) => void;
  setGender: (gender: Gender) => void;
  setOverlayMode: (enabled: boolean) => void;
  addHistoryPoint: (point: HistoryPoint) => void;
  clearHistory: () => void;
  getSelectedVowel: () => VowelData | undefined;
  getF1: (vowel: VowelData) => number;
  getF2: (vowel: VowelData) => number;
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedVowelId: 'i',
  gender: 'male',
  overlayMode: false,
  historyPoints: [],
  setSelectedVowelId: (id: string) => set({ selectedVowelId: id }),
  setGender: (gender: Gender) => set({ gender }),
  setOverlayMode: (enabled: boolean) => set({ overlayMode: enabled }),
  addHistoryPoint: (point: HistoryPoint) =>
    set((state) => ({
      historyPoints: [...state.historyPoints, point],
    })),
  clearHistory: () => set({ historyPoints: [] }),
  getSelectedVowel: () => {
    const { selectedVowelId } = get();
    return VOWELS.find((v) => v.id === selectedVowelId);
  },
  getF1: (vowel: VowelData) => {
    const { gender } = get();
    return getF1Frequency(vowel, gender);
  },
  getF2: (vowel: VowelData) => {
    const { gender } = get();
    return getF2Frequency(vowel, gender);
  },
}));
