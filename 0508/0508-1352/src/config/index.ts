import type { AnalysisConfig, DataCleaningConfig } from '@/types';

export const ANALYSIS_CONFIG: AnalysisConfig = {
  starDishCount: 10,
  slowDishCount: 5,
  problemMarginThreshold: 0.2,
  weekStartsOn: 1,
} as const;

export const DATA_CLEANING_CONFIG: DataCleaningConfig = {
  maxQuantityPerOrder: 50,
  autoDetectAnomalies: true,
} as const;

export const CSV_COLUMNS = {
  ORDER_DATE: '订单日期',
  DISH_NAME: '菜品名称',
  QUANTITY: '份数',
  UNIT_PRICE: '单价',
  COST_PRICE: '成本价',
} as const;

export const DATE_FORMATS = {
  INPUT: ['YYYY-MM-DD', 'YYYY/MM/DD', 'MM/DD/YYYY', 'DD/MM/YYYY'],
  DISPLAY: 'YYYY年MM月DD日',
  WEEK_DISPLAY: 'MM月DD日',
} as const;
