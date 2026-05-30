import { create } from 'zustand';
import type { Star, Constellation, Connection, ProjectionParams, ProjectionType } from '../../shared/types';

interface StarMapState {
  stars: Star[];
  constellations: Constellation[];
  connections: Connection[];
  loading: boolean;
  error: string | null;
  projection: ProjectionParams;
  autoScale: boolean;
  showConstellationLines: boolean;
  showGrid: boolean;
  showStarLabels: boolean;
  hoveredStarId: number | null;
  selectedStarId: number | null;
  plotterMode: {
    active: boolean;
    progress: number;
    speed: number;
    paused: boolean;
  };
  setProjection: (params: Partial<ProjectionParams>) => void;
  setProjectionType: (type: ProjectionType) => void;
  setAutoScale: (autoScale: boolean) => void;
  setStars: (stars: Star[]) => void;
  setConstellations: (constellations: Constellation[]) => void;
  setConnections: (connections: Connection[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setShowConstellationLines: (show: boolean) => void;
  setShowGrid: (show: boolean) => void;
  setShowStarLabels: (show: boolean) => void;
  setHoveredStarId: (id: number | null) => void;
  setSelectedStarId: (id: number | null) => void;
  startPlotterMode: () => void;
  stopPlotterMode: () => void;
  togglePlotterPause: () => void;
  setPlotterProgress: (progress: number) => void;
  setPlotterSpeed: (speed: number) => void;
  resetPlotter: () => void;
}

export const useStarMapStore = create<StarMapState>((set) => ({
  stars: [],
  constellations: [],
  connections: [],
  loading: true,
  error: null,
  projection: {
    type: 'stereographic',
    centerRa: 12,
    centerDec: 60,
    scale: 200,
    rotation: 0,
  },
  autoScale: true,
  showConstellationLines: true,
  showGrid: true,
  showStarLabels: false,
  hoveredStarId: null,
  selectedStarId: null,
  plotterMode: {
    active: false,
    progress: 0,
    speed: 1,
    paused: false,
  },
  setProjection: (params) =>
    set((state) => ({
      projection: { ...state.projection, ...params },
    })),
  setProjectionType: (type) =>
    set((state) => ({
      projection: { ...state.projection, type },
    })),
  setAutoScale: (autoScale) => set({ autoScale }),
  setStars: (stars) => set({ stars }),
  setConstellations: (constellations) => set({ constellations }),
  setConnections: (connections) => set({ connections }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setShowConstellationLines: (show) => set({ showConstellationLines: show }),
  setShowGrid: (show) => set({ showGrid: show }),
  setShowStarLabels: (show) => set({ showStarLabels: show }),
  setHoveredStarId: (id) => set({ hoveredStarId: id }),
  setSelectedStarId: (id) => set({ selectedStarId: id }),
  startPlotterMode: () =>
    set({
      plotterMode: {
        active: true,
        progress: 0,
        speed: 1,
        paused: false,
      },
    }),
  stopPlotterMode: () =>
    set((state) => ({
      plotterMode: {
        ...state.plotterMode,
        active: false,
        progress: 0,
      },
    })),
  togglePlotterPause: () =>
    set((state) => ({
      plotterMode: {
        ...state.plotterMode,
        paused: !state.plotterMode.paused,
      },
    })),
  setPlotterProgress: (progress) =>
    set((state) => ({
      plotterMode: { ...state.plotterMode, progress },
    })),
  setPlotterSpeed: (speed) =>
    set((state) => ({
      plotterMode: { ...state.plotterMode, speed },
    })),
  resetPlotter: () =>
    set((state) => ({
      plotterMode: { ...state.plotterMode, progress: 0, paused: false },
    })),
}));
