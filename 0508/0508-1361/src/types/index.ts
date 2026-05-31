export interface Danmaku {
  time: number;
  text: string;
  sendTime: number;
  pool: number;
  userId: string;
  rowId: string;
}

export interface TimeDistribution {
  bucket: number;
  label: string;
  count: number;
}

export interface WordCount {
  word: string;
  count: number;
}

export interface AnalysisResult {
  danmakuList: Danmaku[];
  timeDistribution: TimeDistribution[];
  wordFrequency: WordCount[];
  videoInfo?: {
    title: string;
    owner: string;
  };
}

export type AnalysisStatus = 'idle' | 'loading' | 'success' | 'error';
