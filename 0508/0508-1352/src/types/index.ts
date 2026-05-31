export interface OrderRecord {
  orderDate: Date;
  dishName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  originalQuantity?: number;
}

export interface WeeklySales {
  week: string;
  weekStart: Date;
  weekEnd: Date;
  quantity: number;
  sales: number;
}

export interface DishStats {
  dishName: string;
  totalQuantity: number;
  totalSales: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  weeklyTrend: WeeklySales[];
}

export interface OverallStats {
  totalOrders: number;
  totalDishes: number;
  totalSales: number;
  totalProfit: number;
  avgProfitMargin: number;
  dateRange: { start: Date; end: Date };
}

export interface CategorizedDishes {
  starDishes: DishStats[];
  slowDishes: DishStats[];
  problemDishes: DishStats[];
}

export interface AnalysisResult {
  overallStats: OverallStats;
  allDishes: DishStats[];
  categorizedDishes: CategorizedDishes;
}

export interface AnalysisConfig {
  starDishCount: number;
  slowDishCount: number;
  problemMarginThreshold: number;
  weekStartsOn: 0 | 1;
}

export interface CSVParseOptions {
  delimiter?: string;
  hasHeader?: boolean;
}

export interface ParseResult<T> {
  data: T[];
  errors: string[];
  meta: {
    rowCount: number;
    delimiter: string;
  };
}

export type TabType = 'star' | 'slow' | 'problem';

export interface IAnalyzer<T> {
  name: string;
  analyze(records: OrderRecord[]): T;
}

export interface DataAdapter<T> {
  parse(raw: string, options?: CSVParseOptions): ParseResult<T>;
  validate(data: unknown[]): { valid: boolean; errors: string[] };
}

export type AnomalyType = 'quantity_too_high' | 'quantity_negative' | 'price_anomaly';

export interface AnomalyRecord {
  id: string;
  rowIndex: number;
  type: AnomalyType;
  dishName: string;
  originalValue: number;
  expectedValue: number;
  message: string;
  record: OrderRecord;
  action: 'pending' | 'fix' | 'delete';
}

export interface DataCleaningConfig {
  maxQuantityPerOrder: number;
  autoDetectAnomalies: boolean;
}

export type AnomalyAction = 'fix' | 'delete' | 'keep';
