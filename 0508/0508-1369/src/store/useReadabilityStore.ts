import { create } from "zustand";
import { analyzeText, calculateReadability, TextAnalysis, ReadabilityResult } from "@/utils/readability";

interface ReadabilityState {
  text: string;
  selectedExampleId: string | null;
  analysis: TextAnalysis | null;
  readability: ReadabilityResult | null;
  setText: (text: string) => void;
  selectExample: (id: string, content: string) => void;
  clearText: () => void;
}

function compute(text: string): { analysis: TextAnalysis | null; readability: ReadabilityResult | null } {
  if (!text.trim()) return { analysis: null, readability: null };
  const analysis = analyzeText(text);
  const readability = calculateReadability(analysis);
  return { analysis, readability };
}

export const useReadabilityStore = create<ReadabilityState>((set) => ({
  text: "",
  selectedExampleId: null,
  analysis: null,
  readability: null,
  setText: (text: string) =>
    set((state) => {
      const { analysis, readability } = compute(text);
      return { text, analysis, readability, selectedExampleId: text === state.text ? state.selectedExampleId : null };
    }),
  selectExample: (id: string, content: string) =>
    set(() => {
      const { analysis, readability } = compute(content);
      return { text: content, selectedExampleId: id, analysis, readability };
    }),
  clearText: () =>
    set({ text: "", selectedExampleId: null, analysis: null, readability: null }),
}));
