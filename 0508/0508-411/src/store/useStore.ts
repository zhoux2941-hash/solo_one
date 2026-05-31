import { create } from 'zustand';
import type { AppState, TabType, QueryResult, ReverseQueryResult } from '@/types';

export const useStore = create<AppState>((set) => ({
  activeTab: 'char-to-code',
  currentRoute: '/',
  queryResult: null,
  reverseQueryResult: null,
  currentPage: 1,
  searchInput: '',
  loading: false,

  setActiveTab: (tab: TabType) => set({ activeTab: tab }),
  setCurrentRoute: (route: string) => set({ currentRoute: route }),
  setQueryResult: (result: QueryResult | null) => set({ queryResult: result }),
  setReverseQueryResult: (result: ReverseQueryResult | null) => set({ reverseQueryResult: result }),
  setCurrentPage: (page: number) => set({ currentPage: page }),
  setSearchInput: (input: string) => set({ searchInput: input }),
  setLoading: (loading: boolean) => set({ loading }),

  resetQuery: () => set({
    queryResult: null,
    reverseQueryResult: null,
    currentPage: 1,
    searchInput: '',
  }),
}));
