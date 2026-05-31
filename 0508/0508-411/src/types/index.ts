export type WubiVersion = '86' | '98' | '新世纪';

export interface WubiCharacter {
  char: string;
  code: string;
  pinyin: string;
  radicals: string[];
  strokeCount: number;
  level: 1 | 2 | 3 | 4;
  frequency: number;
  version: WubiVersion;
}

export interface RadicalStroke {
  path: string;
  radical: string;
  order: number;
}

export interface RadicalData {
  strokes: RadicalStroke[];
  viewBox: string;
}

export interface QueryResult {
  success: boolean;
  data?: WubiCharacter[];
  message?: string;
}

export interface ReverseQueryResult {
  success: boolean;
  data?: WubiCharacter[];
  total?: number;
  page?: number;
  pageSize?: number;
  message?: string;
}

export type TabType = 'char-to-code' | 'code-to-char';

export interface AppState {
  activeTab: TabType;
  currentRoute: string;
  queryResult: QueryResult | null;
  reverseQueryResult: ReverseQueryResult | null;
  currentPage: number;
  searchInput: string;
  loading: boolean;
  setActiveTab: (tab: TabType) => void;
  setCurrentRoute: (route: string) => void;
  setQueryResult: (result: QueryResult | null) => void;
  setReverseQueryResult: (result: ReverseQueryResult | null) => void;
  setCurrentPage: (page: number) => void;
  setSearchInput: (input: string) => void;
  setLoading: (loading: boolean) => void;
  resetQuery: () => void;
}
