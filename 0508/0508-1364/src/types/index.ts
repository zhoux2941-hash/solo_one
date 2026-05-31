export interface GitCommit {
  id: string;
  author: string;
  email: string;
  date: Date;
  message: string;
  filesChanged: number;
  insertions: number;
  deletions: number;
}

export interface AuthorWeeklyStats {
  commits: number;
  insertions: number;
  deletions: number;
}

export interface WeeklyStats {
  weekStart: Date;
  weekEnd: Date;
  weekLabel: string;
  commits: number;
  insertions: number;
  deletions: number;
  byAuthor: Record<string, AuthorWeeklyStats>;
}

export interface AuthorStats {
  name: string;
  totalCommits: number;
  totalInsertions: number;
  totalDeletions: number;
  firstCommit: Date;
  lastCommit: Date;
}

export interface HeatmapData {
  hour: number;
  weekday: number;
  count: number;
}

export interface WordCloudData {
  name: string;
  value: number;
}

export interface FilterOptions {
  authors: string[];
  startDate: Date | null;
  endDate: Date | null;
}

export interface AppState {
  commits: GitCommit[];
  filteredCommits: GitCommit[];
  weeklyStats: WeeklyStats[];
  authorStats: AuthorStats[];
  heatmapData: HeatmapData[][];
  wordCloudData: WordCloudData[];
  filters: FilterOptions;
  isLoading: boolean;
  error: string | null;
  fileName: string | null;
  allAuthors: string[];
  dateRange: {
    min: Date | null;
    max: Date | null;
  };
}

export interface AppActions {
  setCommits: (commits: GitCommit[]) => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  resetFilters: () => void;
  clearData: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export type UseStore = AppState & AppActions;

export const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export const HOURS = Array.from({ length: 24 }, (_, i) => `${i}:00`);

export const AUTHOR_COLORS = [
  '#0c8ae6',
  '#ff6b35',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#84cc16',
  '#6366f1',
];
