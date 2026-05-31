import { create } from 'zustand';
import { RouteNode } from '@/data/inventions';

interface MapState {
  selectedInvention: string | null;
  selectedNode: RouteNode | null;
  hoveredNode: string | null;
  isPanelOpen: boolean;
  selectInvention: (id: string | null) => void;
  selectNode: (node: RouteNode | null) => void;
  setHoveredNode: (id: string | null) => void;
  togglePanel: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  selectedInvention: null,
  selectedNode: null,
  hoveredNode: null,
  isPanelOpen: false,
  selectInvention: (id) =>
    set((state) => ({
      selectedInvention: state.selectedInvention === id ? null : id,
      selectedNode: null,
      isPanelOpen: state.selectedInvention === id ? false : true,
    })),
  selectNode: (node) => set({ selectedNode: node }),
  setHoveredNode: (id) => set({ hoveredNode: id }),
  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
}));
