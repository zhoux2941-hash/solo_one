import { create } from 'zustand';
import type { UseStore, GitCommit, FilterOptions } from '../types';
import { filterCommits, calculateWeeklyStats, calculateAuthorStats, generateHeatmapData, getAllAuthors, getDateRange } from '../utils/statistics';
import { generateWordCloudData } from '../utils/wordCloud';

const initialFilters: FilterOptions = {
  authors: [],
  startDate: null,
  endDate: null,
};

export const useStore = create<UseStore>((set, get) => ({
  commits: [],
  filteredCommits: [],
  weeklyStats: [],
  authorStats: [],
  heatmapData: [],
  wordCloudData: [],
  filters: initialFilters,
  isLoading: false,
  error: null,
  fileName: null,
  allAuthors: [],
  dateRange: {
    min: null,
    max: null,
  },

  setCommits: (commits: GitCommit[]) => {
    const allAuthors = getAllAuthors(commits);
    const dateRange = getDateRange(commits);
    const filters: FilterOptions = {
      authors: [],
      startDate: null,
      endDate: null,
    };
    const filteredCommits = filterCommits(commits, filters);
    const weeklyStats = calculateWeeklyStats(filteredCommits);
    const authorStats = calculateAuthorStats(filteredCommits);
    const heatmapData = generateHeatmapData(filteredCommits);
    const wordCloudData = generateWordCloudData(filteredCommits);

    set({
      commits,
      filteredCommits,
      weeklyStats,
      authorStats,
      heatmapData,
      wordCloudData,
      allAuthors,
      dateRange,
      filters,
      error: null,
    });
  },

  setFilters: (newFilters: Partial<FilterOptions>) => {
    const { commits, filters: currentFilters } = get();
    const filters = { ...currentFilters, ...newFilters };
    const filteredCommits = filterCommits(commits, filters);
    const weeklyStats = calculateWeeklyStats(filteredCommits);
    const authorStats = calculateAuthorStats(filteredCommits);
    const heatmapData = generateHeatmapData(filteredCommits);
    const wordCloudData = generateWordCloudData(filteredCommits);

    set({
      filters,
      filteredCommits,
      weeklyStats,
      authorStats,
      heatmapData,
      wordCloudData,
    });
  },

  resetFilters: () => {
    const { commits } = get();
    const filters = initialFilters;
    const filteredCommits = filterCommits(commits, filters);
    const weeklyStats = calculateWeeklyStats(filteredCommits);
    const authorStats = calculateAuthorStats(filteredCommits);
    const heatmapData = generateHeatmapData(filteredCommits);
    const wordCloudData = generateWordCloudData(filteredCommits);

    set({
      filters,
      filteredCommits,
      weeklyStats,
      authorStats,
      heatmapData,
      wordCloudData,
    });
  },

  clearData: () => {
    set({
      commits: [],
      filteredCommits: [],
      weeklyStats: [],
      authorStats: [],
      heatmapData: [],
      wordCloudData: [],
      filters: initialFilters,
      error: null,
      fileName: null,
      allAuthors: [],
      dateRange: {
        min: null,
        max: null,
      },
    });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));
