import { create } from 'zustand';
import {
  HuffmanNode,
  CodeEntry,
  CompressionResult,
  BuildStep,
  countFrequencies,
  buildHuffmanTree,
  generateCodes,
  calculateCompression,
} from '@/utils/huffman';

interface HuffmanState {
  inputText: string;
  frequencyMap: Map<string, number>;
  root: HuffmanNode | null;
  codes: CodeEntry[];
  compression: CompressionResult | null;
  steps: BuildStep[];
  currentStep: number;
  isPlaying: boolean;
  totalWeight: number;

  setInputText: (text: string) => void;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetStep: () => void;
  setIsPlaying: (playing: boolean) => void;
  process: () => void;
  adjustWeight: (char: string, delta: number) => void;
  resetWeights: () => void;
}

function processFromFreqMap(freqMap: Map<string, number>) {
  if (freqMap.size === 0) {
    return {
      frequencyMap: new Map(),
      root: null,
      codes: [],
      compression: null,
      steps: [],
      currentStep: 0,
      totalWeight: 0,
    };
  }

  const { root, steps } = buildHuffmanTree(freqMap);
  const codes = generateCodes(root);
  const totalWeight = Array.from(freqMap.values()).reduce((sum, w) => sum + w, 0);
  const compression = calculateCompression(codes, totalWeight);

  return {
    frequencyMap: freqMap,
    root,
    codes,
    compression,
    steps,
    currentStep: steps.length > 0 ? steps.length - 1 : 0,
    totalWeight,
  };
}

export const useHuffmanStore = create<HuffmanState>((set, get) => ({
  inputText: '',
  frequencyMap: new Map(),
  root: null,
  codes: [],
  compression: null,
  steps: [],
  currentStep: 0,
  isPlaying: false,
  totalWeight: 0,

  setInputText: (text: string) => {
    set({ inputText: text });
    if (text.length > 0) {
      get().process();
    } else {
      set({
        frequencyMap: new Map(),
        root: null,
        codes: [],
        compression: null,
        steps: [],
        currentStep: 0,
        totalWeight: 0,
      });
    }
  },

  setCurrentStep: (step: number) => {
    set({ currentStep: step });
  },

  nextStep: () => {
    const { currentStep, steps } = get();
    if (currentStep < steps.length - 1) {
      set({ currentStep: currentStep + 1 });
    } else {
      set({ isPlaying: false });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },

  resetStep: () => {
    set({ currentStep: 0, isPlaying: false });
  },

  setIsPlaying: (playing: boolean) => {
    set({ isPlaying: playing });
  },

  process: () => {
    const { inputText } = get();
    const filtered = inputText.replace(/[^a-zA-Z ]/g, '');
    if (!filtered) {
      set({
        frequencyMap: new Map(),
        root: null,
        codes: [],
        compression: null,
        steps: [],
        currentStep: 0,
        totalWeight: 0,
      });
      return;
    }

    const freqMap = countFrequencies(filtered);
    const result = processFromFreqMap(freqMap);
    set({
      ...result,
      isPlaying: false,
    });
  },

  adjustWeight: (char: string, delta: number) => {
    const { frequencyMap, isPlaying } = get();
    const newMap = new Map(frequencyMap);
    const current = newMap.get(char) || 0;
    const newValue = Math.max(1, current + delta);
    newMap.set(char, newValue);

    const result = processFromFreqMap(newMap);
    set({
      ...result,
      isPlaying: isPlaying && result.steps.length > result.currentStep,
    });
  },

  resetWeights: () => {
    get().process();
  },
}));
