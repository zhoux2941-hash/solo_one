import { create } from 'zustand';
import type { RouteResult, FavoriteRoute } from '@/types';
import { findRoute } from '@/utils/routeAlgorithm';
import {
  loadFavorites,
  addFavorite as addFav,
  removeFavorite as removeFav,
} from '@/utils/favoritesStorage';
import { stations } from '@/data/railwayConfig';

interface AppState {
  selectedStationId: string | null;
  highlightedLineId: string | null;
  routeResult: RouteResult | null;
  routeFrom: string;
  routeTo: string;
  favorites: FavoriteRoute[];
  showRoutePanel: boolean;
  showFavoritesPanel: boolean;
  activeTab: 'route' | 'favorites';

  selectStation: (id: string | null) => void;
  highlightLine: (id: string | null) => void;
  setRouteFrom: (val: string) => void;
  setRouteTo: (val: string) => void;
  searchRoute: () => void;
  clearRoute: () => void;
  addFavorite: () => void;
  removeFavorite: (id: string) => void;
  loadFavRoute: (from: string, to: string) => void;
  setActiveTab: (tab: 'route' | 'favorites') => void;
  toggleRoutePanel: () => void;
  toggleFavoritesPanel: () => void;
  swapRouteInputs: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedStationId: null,
  highlightedLineId: null,
  routeResult: null,
  routeFrom: '',
  routeTo: '',
  favorites: loadFavorites(),
  showRoutePanel: false,
  showFavoritesPanel: false,
  activeTab: 'route',

  selectStation: (id) => set({ selectedStationId: id }),

  highlightLine: (id) =>
    set({ highlightedLineId: id === get().highlightedLineId ? null : id }),

  setRouteFrom: (val) => set({ routeFrom: val }),
  setRouteTo: (val) => set({ routeTo: val }),

  searchRoute: () => {
    const { routeFrom, routeTo } = get();
    const fromStation = stations.find(
      (s) => s.name === routeFrom || s.id === routeFrom
    );
    const toStation = stations.find(
      (s) => s.name === routeTo || s.id === routeTo
    );
    if (!fromStation || !toStation) return;

    const result = findRoute(fromStation.id, toStation.id);
    set({ routeResult: result, routeFrom: fromStation.name, routeTo: toStation.name });
  },

  clearRoute: () =>
    set({ routeResult: null, routeFrom: '', routeTo: '' }),

  addFavorite: () => {
    const { routeFrom, routeTo } = get();
    const fromStation = stations.find((s) => s.name === routeFrom);
    const toStation = stations.find((s) => s.name === routeTo);
    if (!fromStation || !toStation) return;
    addFav(fromStation.id, toStation.id, fromStation.name, toStation.name);
    set({ favorites: loadFavorites() });
  },

  removeFavorite: (id) => {
    removeFav(id);
    set({ favorites: loadFavorites() });
  },

  loadFavRoute: (from, to) => {
    const fromStation = stations.find((s) => s.id === from || s.name === from);
    const toStation = stations.find((s) => s.id === to || s.name === to);
    if (!fromStation || !toStation) return;
    const result = findRoute(fromStation.id, toStation.id);
    set({
      routeFrom: fromStation.name,
      routeTo: toStation.name,
      routeResult: result,
      showRoutePanel: true,
      activeTab: 'route',
    });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  toggleRoutePanel: () => {
    const { showRoutePanel } = get();
    set({ showRoutePanel: !showRoutePanel, activeTab: 'route' });
  },

  toggleFavoritesPanel: () => {
    const { showFavoritesPanel } = get();
    set({ showFavoritesPanel: !showFavoritesPanel, activeTab: 'favorites' });
  },

  swapRouteInputs: () => {
    const { routeFrom, routeTo } = get();
    set({ routeFrom: routeTo, routeTo: routeFrom });
  },
}));
