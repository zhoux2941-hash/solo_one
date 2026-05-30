import { create } from 'zustand';

export type SymmetryMode = 'none' | 'horizontal' | 'vertical' | 'rotational';

export interface PatternElement {
  id: string;
  patternId: number;
  name: string;
  svgPath: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
}

interface EditorState {
  elements: PatternElement[];
  selectedId: string | null;
  symmetryMode: SymmetryMode;
  showGrid: boolean;
  canvasWidth: number;
  canvasHeight: number;
  showFabricTexture: boolean;
  fabricOpacity: number;
  showCrackEffect: boolean;
  crackIntensity: number;
  crackSeed: number;
  addElement: (element: PatternElement) => void;
  removeElement: (id: string) => void;
  updateElement: (id: string, updates: Partial<PatternElement>) => void;
  setSelectedId: (id: string | null) => void;
  setSymmetryMode: (mode: SymmetryMode) => void;
  toggleGrid: () => void;
  clearCanvas: () => void;
  setCanvasSize: (width: number, height: number) => void;
  toggleFabricTexture: () => void;
  setFabricOpacity: (opacity: number) => void;
  toggleCrackEffect: () => void;
  setCrackIntensity: (intensity: number) => void;
  regenerateCracks: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  elements: [],
  selectedId: null,
  symmetryMode: 'none',
  showGrid: true,
  canvasWidth: 800,
  canvasHeight: 600,
  showFabricTexture: false,
  fabricOpacity: 0.5,
  showCrackEffect: false,
  crackIntensity: 0.5,
  crackSeed: Date.now(),
  addElement: (element) =>
    set((state) => ({
      elements: [...state.elements, element],
      selectedId: element.id,
    })),
  removeElement: (id) =>
    set((state) => ({
      elements: state.elements.filter((e) => e.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),
  updateElement: (id, updates) =>
    set((state) => ({
      elements: state.elements.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    })),
  setSelectedId: (id) => set({ selectedId: id }),
  setSymmetryMode: (mode) => set({ symmetryMode: mode }),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  clearCanvas: () => set({ elements: [], selectedId: null }),
  setCanvasSize: (width, height) => set({ canvasWidth: width, canvasHeight: height }),
  toggleFabricTexture: () => set((state) => ({ showFabricTexture: !state.showFabricTexture })),
  setFabricOpacity: (opacity) => set({ fabricOpacity: opacity }),
  toggleCrackEffect: () => set((state) => ({ showCrackEffect: !state.showCrackEffect })),
  setCrackIntensity: (intensity) => set({ crackIntensity: intensity }),
  regenerateCracks: () => set({ crackSeed: Date.now() }),
}));
