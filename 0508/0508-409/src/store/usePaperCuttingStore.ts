import { create } from 'zustand';
import { Point, DrawPath, FoldStep, AppState, ToolSettings, DEFAULT_TOOL_SETTINGS } from '../types';

interface PaperCuttingState extends AppState {
  fold: () => void;
  unfold: () => void;
  reset: () => void;
  startDrawing: (point: Point) => void;
  continueDrawing: (point: Point) => void;
  endDrawing: () => void;
  clearDrawings: () => void;
  undo: () => void;
  setToolSettings: (settings: Partial<ToolSettings>) => void;
  setUnfoldProgress: (progress: number) => void;
  setIsAnimating: (animating: boolean) => void;
  setShowFinalResult: (show: boolean) => void;
  setIsUnfolding: (unfolding: boolean) => void;
  history: DrawPath[][];
  historyIndex: number;
}

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

type StateFunctionKeys = {
  [K in keyof PaperCuttingState]: PaperCuttingState[K] extends (...args: never[]) => unknown ? K : never;
}[keyof PaperCuttingState];

const initialState: Omit<PaperCuttingState, StateFunctionKeys> = {
  currentFoldStep: 0,
  drawPaths: [],
  currentPath: null,
  isDrawing: false,
  isUnfolding: false,
  showFinalResult: false,
  unfoldProgress: 0,
  toolSettings: { ...DEFAULT_TOOL_SETTINGS },
  isAnimating: false,
  history: [[]],
  historyIndex: 0,
};

export const usePaperCuttingStore = create<PaperCuttingState>((set, get) => ({
  ...initialState,

  fold: () => {
    const { currentFoldStep, isAnimating, isUnfolding, showFinalResult } = get();
    if (isAnimating || isUnfolding || showFinalResult) return;
    if (currentFoldStep >= 3) return;

    set({ isAnimating: true });
    setTimeout(() => {
      set((state) => ({
        currentFoldStep: (state.currentFoldStep + 1) as FoldStep,
        isAnimating: false,
      }));
    }, 600);
  },

  unfold: () => {
    const { currentFoldStep, isAnimating, isUnfolding } = get();
    if (isAnimating || isUnfolding) return;
    if (currentFoldStep < 3) return;

    set({ isUnfolding: true, isAnimating: true });
  },

  reset: () => {
    set({
      ...initialState,
      toolSettings: { ...DEFAULT_TOOL_SETTINGS },
      history: [[]],
    });
  },

  startDrawing: (point: Point) => {
    const { currentFoldStep, toolSettings, isAnimating, isUnfolding, showFinalResult } = get();
    if (isAnimating || isUnfolding || showFinalResult) return;
    if (currentFoldStep < 3) return;

    const newPath: DrawPath = {
      id: generateId(),
      points: [point],
      color: toolSettings.color,
      lineWidth: toolSettings.lineWidth,
      foldStep: currentFoldStep,
    };

    set({
      isDrawing: true,
      currentPath: newPath,
    });
  },

  continueDrawing: (point: Point) => {
    const { isDrawing, currentPath, isAnimating, isUnfolding, showFinalResult } = get();
    if (!isDrawing || !currentPath || isAnimating || isUnfolding || showFinalResult) return;

    const lastPoint = currentPath.points[currentPath.points.length - 1];
    const dx = point.x - lastPoint.x;
    const dy = point.y - lastPoint.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist >= 2) {
      set((state) => ({
        currentPath: state.currentPath
          ? {
              ...state.currentPath,
              points: [...state.currentPath.points, point],
            }
          : null,
      }));
    }
  },

  endDrawing: () => {
    const { isDrawing, currentPath, drawPaths, history, historyIndex } = get();
    if (!isDrawing || !currentPath) return;

    if (currentPath.points.length >= 2) {
      const newPaths = [...drawPaths, currentPath];
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newPaths);

      set({
        drawPaths: newPaths,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      });
    }

    set({
      isDrawing: false,
      currentPath: null,
    });
  },

  clearDrawings: () => {
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([]);

    set({
      drawPaths: [],
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex <= 0) return;

    const newIndex = historyIndex - 1;
    set({
      drawPaths: history[newIndex] || [],
      historyIndex: newIndex,
    });
  },

  setToolSettings: (settings: Partial<ToolSettings>) => {
    set((state) => ({
      toolSettings: { ...state.toolSettings, ...settings },
    }));
  },

  setUnfoldProgress: (progress: number) => {
    set({ unfoldProgress: progress });
  },

  setIsAnimating: (animating: boolean) => {
    set({ isAnimating: animating });
  },

  setShowFinalResult: (show: boolean) => {
    set({ showFinalResult: show });
  },

  setIsUnfolding: (unfolding: boolean) => {
    set({ isUnfolding: unfolding });
  },
}));
