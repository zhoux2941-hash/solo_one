import { create } from 'zustand';
import { DYNASTIES, type DynastyData } from '@/data/dynastyData';

interface MapState {
  selectedDynasty: DynastyData;
  isTransitioning: boolean;
  showErrorLayer: boolean;
  selectDynasty: (id: string) => void;
  toggleErrorLayer: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  selectedDynasty: DYNASTIES[0],
  isTransitioning: false,
  showErrorLayer: true,
  selectDynasty: (id: string) => {
    const dynasty = DYNASTIES.find((d) => d.id === id);
    if (dynasty) {
      set({ isTransitioning: true });
      setTimeout(() => {
        set({ selectedDynasty: dynasty, isTransitioning: false });
      }, 300);
    }
  },
  toggleErrorLayer: () => set((state) => ({ showErrorLayer: !state.showErrorLayer })),
}));
