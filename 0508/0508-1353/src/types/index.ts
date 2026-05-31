export type GarbageType = 'recyclable' | 'kitchen' | 'harmful' | 'other';

export const GARBAGE_TYPE_CONFIG: Record<GarbageType, { name: string; color: string }> = {
  recyclable: { name: '可回收物', color: '#2196F3' },
  kitchen: { name: '厨余垃圾', color: '#4CAF50' },
  harmful: { name: '有害垃圾', color: '#F44336' },
  other: { name: '其他垃圾', color: '#9E9E9E' },
};

export interface GarbageRecord {
  bagId: string;
 投放时间: Date;
  buildingNumber: string;
  garbageType: GarbageType;
  isCorrect: boolean;
}

export interface TypeStats {
  type: GarbageType;
  typeName: string;
  total: number;
  correct: number;
  accuracy: number;
  color: string;
}

export interface BuildingStats {
  buildingNumber: string;
  total: number;
  correct: number;
  accuracy: number;
}

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface AppState {
  records: GarbageRecord[];
  dateRange: DateRange;
  filteredRecords: GarbageRecord[];
  typeStats: TypeStats[];
  buildingStats: BuildingStats[];
  isLoading: boolean;
  error: string | null;
  fileName: string;
}

export interface CsvRow {
  垃圾袋ID: string;
  投放时间: string;
  居民楼号: string;
  垃圾类型: string;
  是否正确投放: string;
}
