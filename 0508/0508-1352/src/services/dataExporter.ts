import type { AnalysisResult, DishStats } from '@/types';
import { formatCurrency, formatPercent, formatDate } from '@/utils';

export class DataExporter {
  exportToCSV(result: AnalysisResult): void {
    const content = this.generateCSVContent(result);
    this.downloadFile(content, '销售分析报告.csv', 'text/csv;charset=utf-8;');
  }

  exportDishToCSV(dish: DishStats): void {
    const content = this.generateDishCSVContent(dish);
    this.downloadFile(content, `${dish.dishName}_销量趋势.csv`, 'text/csv;charset=utf-8;');
  }

  private generateCSVContent(result: AnalysisResult): string {
    const lines: string[] = [];

    lines.push('=== 整体统计 ===');
    lines.push(['指标', '数值'].join(','));
    lines.push(['订单总数', result.overallStats.totalOrders].join(','));
    lines.push(['菜品总数', result.overallStats.totalDishes].join(','));
    lines.push(['总销售额', formatCurrency(result.overallStats.totalSales)].join(','));
    lines.push(['总毛利', formatCurrency(result.overallStats.totalProfit)].join(','));
    lines.push(['平均毛利率', formatPercent(result.overallStats.avgProfitMargin)].join(','));
    lines.push(['统计周期', `${formatDate(result.overallStats.dateRange.start)} 至 ${formatDate(result.overallStats.dateRange.end)}`].join(','));
    lines.push('');

    lines.push('=== 明星菜品（销量前10）===');
    lines.push(['排名', '菜品名称', '总销量', '销售额', '毛利', '毛利率'].join(','));
    result.categorizedDishes.starDishes.forEach((dish, index) => {
      lines.push([
        index + 1,
        dish.dishName,
        dish.totalQuantity,
        formatCurrency(dish.totalSales),
        formatCurrency(dish.totalProfit),
        formatPercent(dish.profitMargin),
      ].join(','));
    });
    lines.push('');

    lines.push('=== 滞销菜品（销量后5）===');
    lines.push(['排名', '菜品名称', '总销量', '销售额', '毛利', '毛利率'].join(','));
    result.categorizedDishes.slowDishes.forEach((dish, index) => {
      lines.push([
        index + 1,
        dish.dishName,
        dish.totalQuantity,
        formatCurrency(dish.totalSales),
        formatCurrency(dish.totalProfit),
        formatPercent(dish.profitMargin),
      ].join(','));
    });
    lines.push('');

    lines.push('=== 问题菜品（毛利率<20%）===');
    lines.push(['菜品名称', '总销量', '销售额', '毛利', '毛利率'].join(','));
    result.categorizedDishes.problemDishes.forEach((dish) => {
      lines.push([
        dish.dishName,
        dish.totalQuantity,
        formatCurrency(dish.totalSales),
        formatCurrency(dish.totalProfit),
        formatPercent(dish.profitMargin),
      ].join(','));
    });
    lines.push('');

    lines.push('=== 所有菜品统计 ===');
    lines.push(['菜品名称', '总销量', '销售额', '成本', '毛利', '毛利率'].join(','));
    result.allDishes.forEach((dish) => {
      lines.push([
        dish.dishName,
        dish.totalQuantity,
        formatCurrency(dish.totalSales),
        formatCurrency(dish.totalCost),
        formatCurrency(dish.totalProfit),
        formatPercent(dish.profitMargin),
      ].join(','));
    });

    const BOM = '\uFEFF';
    return BOM + lines.join('\n');
  }

  private generateDishCSVContent(dish: DishStats): string {
    const lines: string[] = [];

    lines.push(['菜品名称', dish.dishName].join(','));
    lines.push(['总销量', dish.totalQuantity].join(','));
    lines.push(['总销售额', formatCurrency(dish.totalSales)].join(','));
    lines.push(['总成本', formatCurrency(dish.totalCost)].join(','));
    lines.push(['总毛利', formatCurrency(dish.totalProfit)].join(','));
    lines.push(['毛利率', formatPercent(dish.profitMargin)].join(','));
    lines.push('');

    lines.push('=== 周销量趋势 ===');
    lines.push(['周期', '销量', '销售额'].join(','));
    dish.weeklyTrend.forEach((week) => {
      lines.push([
        week.week,
        week.quantity,
        formatCurrency(week.sales),
      ].join(','));
    });

    const BOM = '\uFEFF';
    return BOM + lines.join('\n');
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const dataExporter = new DataExporter();
