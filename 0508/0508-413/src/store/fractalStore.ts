import { create } from 'zustand';
import { ViewState, RenderProgress, DEFAULT_VIEW_STATE } from '../types/fractal';

type SetStateAction<T> = Partial<T> | ((prev: T) => Partial<T>);

interface FractalStore {
  viewState: ViewState;
  renderProgress: RenderProgress;
  setViewState: (state: SetStateAction<ViewState>) => void;
  resetViewState: () => void;
  setRenderProgress: (progress: SetStateAction<RenderProgress>) => void;
}

export const useFractalStore = create<FractalStore>((set) => ({
  viewState: { ...DEFAULT_VIEW_STATE },
  renderProgress: {
    totalBlocks: 0,
    completedBlocks: 0,
    percentage: 0,
    isRendering: false,
  },
  setViewState: (newState) =>
    set((state) => ({
      viewState: {
        ...state.viewState,
        ...(typeof newState === 'function' ? newState(state.viewState) : newState),
      },
    })),
  resetViewState: () =>
    set(() => ({
      viewState: { ...DEFAULT_VIEW_STATE },
    })),
  setRenderProgress: (newProgress) =>
    set((state) => ({
      renderProgress: {
        ...state.renderProgress,
        ...(typeof newProgress === 'function'
          ? newProgress(state.renderProgress)
          : newProgress),
      },
    })),
}));
