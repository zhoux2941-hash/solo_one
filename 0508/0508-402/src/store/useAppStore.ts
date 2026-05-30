import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Store } from '../types';

export const useAppStore = create<Store>()(
  persist(
    (set) => ({
      selectedCityId: null,
      compareMode: false,
      compareCityIds: [],
      favorites: [],
      activeHotspotId: null,

      setSelectedCity: (cityId) => set({ selectedCityId: cityId }),

      toggleCompareMode: () => set((state) => ({ 
        compareMode: !state.compareMode,
        compareCityIds: !state.compareMode ? [] : state.compareCityIds,
      })),

      addCompareCity: (cityId) => set((state) => {
        if (state.compareCityIds.length >= 2) return state;
        if (state.compareCityIds.includes(cityId)) return state;
        return { compareCityIds: [...state.compareCityIds, cityId] };
      }),

      removeCompareCity: (cityId) => set((state) => ({
        compareCityIds: state.compareCityIds.filter(id => id !== cityId),
      })),

      clearCompareCities: () => set({ compareCityIds: [] }),

      toggleFavorite: (cityId) => set((state) => ({
        favorites: state.favorites.includes(cityId)
          ? state.favorites.filter(id => id !== cityId)
          : [...state.favorites, cityId],
      })),

      setActiveHotspot: (hotspotId) => set({ activeHotspotId: hotspotId }),
    }),
    {
      name: 'ancient-cities-storage',
      partialize: (state) => ({ favorites: state.favorites }),
    }
  )
);
