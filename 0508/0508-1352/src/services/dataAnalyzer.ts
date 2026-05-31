import type {
  IAnalyzer,
  OrderRecord,
  DishStats,
  WeeklySales,
  OverallStats,
  CategorizedDishes,
  AnalysisResult,
} from '@/types';
import { ANALYSIS_CONFIG } from '@/config';
import { getWeekKey, getWeekStart, getWeekEnd, formatWeekRange } from '@/utils';

abstract class BaseAnalyzer<T> implements IAnalyzer<T> {
  abstract name: string;
  abstract analyze(records: OrderRecord[]): T;
}

export class DishSalesAnalyzer extends BaseAnalyzer<DishStats[]> {
  name = 'DishSalesAnalyzer';

  analyze(records: OrderRecord[]): DishStats[] {
    const dishMap = new Map<string, {
      totalQuantity: number;
      totalSales: number;
      totalCost: number;
      weeklyData: Map<string, { quantity: number; sales: number }>;
    }>();

    records.forEach((record) => {
      const existing = dishMap.get(record.dishName) || {
        totalQuantity: 0,
        totalSales: 0,
        totalCost: 0,
        weeklyData: new Map(),
      };

      const sales = record.quantity * record.unitPrice;
      const cost = record.quantity * record.costPrice;
      const weekKey = getWeekKey(record.orderDate);

      existing.totalQuantity += record.quantity;
      existing.totalSales += sales;
      existing.totalCost += cost;

      const weekExisting = existing.weeklyData.get(weekKey) || { quantity: 0, sales: 0 };
      weekExisting.quantity += record.quantity;
      weekExisting.sales += sales;
      existing.weeklyData.set(weekKey, weekExisting);

      dishMap.set(record.dishName, existing);
    });

    const allWeeks = this.getAllWeeks(records);

    return Array.from(dishMap.entries()).map(([dishName, data]) => {
      const totalProfit = data.totalSales - data.totalCost;
      const profitMargin = data.totalSales > 0 ? totalProfit / data.totalSales : 0;

      const weeklyTrend: WeeklySales[] = allWeeks.map((weekDate) => {
        const weekKey = getWeekKey(weekDate);
        const weekData = data.weeklyData.get(weekKey) || { quantity: 0, sales: 0 };
        const weekStart = getWeekStart(weekDate);
        const weekEnd = getWeekEnd(weekDate);
        return {
          week: formatWeekRange(weekStart, weekEnd),
          weekStart,
          weekEnd,
          quantity: weekData.quantity,
          sales: weekData.sales,
        };
      });

      return {
        dishName,
        totalQuantity: data.totalQuantity,
        totalSales: data.totalSales,
        totalCost: data.totalCost,
        totalProfit,
        profitMargin,
        weeklyTrend,
      };
    });
  }

  private getAllWeeks(records: OrderRecord[]): Date[] {
    if (records.length === 0) return [];

    const dates = records.map((r) => r.orderDate);
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    const weeks: Date[] = [];
    let current = getWeekStart(minDate);
    const end = getWeekStart(maxDate);

    while (current <= end) {
      weeks.push(new Date(current));
      current.setDate(current.getDate() + 7);
    }

    return weeks;
  }
}

export class OverallStatsAnalyzer extends BaseAnalyzer<OverallStats> {
  name = 'OverallStatsAnalyzer';

  analyze(records: OrderRecord[]): OverallStats {
    const validRecords = records.filter((r) => r.quantity > 0);
    const totalOrders = validRecords.length;
    const totalDishes = validRecords.reduce((sum, r) => sum + r.quantity, 0);
    const totalSales = validRecords.reduce((sum, r) => sum + r.quantity * r.unitPrice, 0);
    const totalCost = validRecords.reduce((sum, r) => sum + r.quantity * r.costPrice, 0);
    const totalProfit = totalSales - totalCost;
    const avgProfitMargin = totalSales > 0 ? totalProfit / totalSales : 0;

    const dates = records.map((r) => r.orderDate);
    const start = new Date(Math.min(...dates.map((d) => d.getTime())));
    const end = new Date(Math.max(...dates.map((d) => d.getTime())));

    return {
      totalOrders,
      totalDishes,
      totalSales,
      totalProfit,
      avgProfitMargin,
      dateRange: { start, end },
    };
  }
}

export class DishCategorizer {
  static categorize(dishes: DishStats[]): CategorizedDishes {
    const sortedByQuantity = [...dishes].sort((a, b) => b.totalQuantity - a.totalQuantity);

    const starDishes = sortedByQuantity.slice(0, ANALYSIS_CONFIG.starDishCount);

    const zeroSalesDishes = sortedByQuantity.filter((d) => d.totalQuantity === 0);
    const nonZeroDishes = sortedByQuantity.filter((d) => d.totalQuantity > 0);
    const lowSalesDishes = nonZeroDishes
      .slice(-Math.max(ANALYSIS_CONFIG.slowDishCount - zeroSalesDishes.length, 0))
      .reverse();
    const slowDishes = [...zeroSalesDishes, ...lowSalesDishes];

    const problemDishes = dishes
      .filter((d) => d.profitMargin < ANALYSIS_CONFIG.problemMarginThreshold)
      .sort((a, b) => a.profitMargin - b.profitMargin);

    return {
      starDishes,
      slowDishes,
      problemDishes,
    };
  }
}

export class DataAnalyzer {
  private analyzers: BaseAnalyzer<unknown>[] = [
    new DishSalesAnalyzer(),
    new OverallStatsAnalyzer(),
  ];

  addAnalyzer(analyzer: BaseAnalyzer<unknown>): void {
    this.analyzers.push(analyzer);
  }

  analyze(records: OrderRecord[]): AnalysisResult {
    const dishSalesAnalyzer = this.analyzers.find(
      (a) => a.name === 'DishSalesAnalyzer'
    ) as DishSalesAnalyzer;
    const overallStatsAnalyzer = this.analyzers.find(
      (a) => a.name === 'OverallStatsAnalyzer'
    ) as OverallStatsAnalyzer;

    const allDishes = dishSalesAnalyzer.analyze(records);
    const overallStats = overallStatsAnalyzer.analyze(records);
    const categorizedDishes = DishCategorizer.categorize(allDishes);

    return {
      overallStats,
      allDishes,
      categorizedDishes,
    };
  }
}

export const dataAnalyzer = new DataAnalyzer();
