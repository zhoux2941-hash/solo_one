import React, { useEffect, useState } from 'react';
import { X, Download, TrendingUp, BarChart2 } from 'lucide-react';
import type { DishStats } from '@/types';
import { TrendChart } from './TrendChart';
import { formatCurrency, formatNumber, formatPercent, cn } from '@/utils';
import { dataExporter } from '@/services';

interface DishDetailModalProps {
  dish: DishStats | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DishDetailModal: React.FC<DishDetailModalProps> = ({
  dish,
  isOpen,
  onClose,
}) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleExport = () => {
    if (dish) {
      dataExporter.exportDishToCSV(dish);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !dish) return null;

  const getMarginColor = () => {
    if (dish.totalQuantity === 0) return 'text-gray-400 bg-gray-50';
    if (dish.profitMargin >= 0.5) return 'text-emerald-600 bg-emerald-50';
    if (dish.profitMargin >= 0.3) return 'text-primary-600 bg-primary-50';
    if (dish.profitMargin >= 0.2) return 'text-amber-600 bg-amber-50';
    return 'text-accent-600 bg-accent-50';
  };

  const avgWeeklySales = dish.weeklyTrend.length > 0
    ? dish.totalQuantity / dish.weeklyTrend.length
    : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl animate-slide-up">
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-white border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 font-display">
              {dish.dishName}
            </h2>
            <p className="text-sm text-gray-500 mt-1">菜品销售详情分析</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <Download className="w-4 h-4" />
              导出数据
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">总销量</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(dish.totalQuantity)}</p>
              <p className="text-xs text-gray-400 mt-1">份</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">总销售额</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(dish.totalSales)}</p>
              <p className="text-xs text-gray-400 mt-1">元</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">总毛利</p>
              <p className="text-2xl font-bold text-primary-600">{formatCurrency(dish.totalProfit)}</p>
              <p className="text-xs text-gray-400 mt-1">元</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">毛利率</p>
              <p className={cn('text-2xl font-bold', getMarginColor().split(' ')[0])}>
                {formatPercent(dish.profitMargin)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {dish.totalQuantity === 0 ? '无销售数据' : dish.profitMargin < 0.2 ? '⚠️ 偏低' : '正常'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-gradient-to-br from-primary-50 to-white rounded-xl border border-primary-100">
              <p className="text-sm text-gray-600 mb-1">周均销量</p>
              <p className="text-xl font-bold text-primary-700">
                {formatNumber(Math.round(avgWeeklySales))} 份
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-gold-50 to-white rounded-xl border border-gold-100">
              <p className="text-sm text-gray-600 mb-1">销售周期</p>
              <p className="text-xl font-bold text-gold-700">
                {dish.weeklyTrend.length} 周
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100">
              <p className="text-sm text-gray-600 mb-1">平均单价</p>
              <p className="text-xl font-bold text-blue-700">
                {dish.totalQuantity > 0 ? formatCurrency(dish.totalSales / dish.totalQuantity) : '-'}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">周销量趋势</h3>
              <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setChartType('line')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                    chartType === 'line'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  <TrendingUp className="w-4 h-4" />
                  折线图
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                    chartType === 'bar'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  <BarChart2 className="w-4 h-4" />
                  柱状图
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <TrendChart data={dish.weeklyTrend} type={chartType} />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">详细数据</h3>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">周期</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">销量</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">销售额</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">占比</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dish.weeklyTrend.map((week, index) => {
                    const quantityPercent = dish.totalQuantity > 0
                      ? (week.quantity / dish.totalQuantity) * 100
                      : 0;
                    return (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800">{week.week}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{formatNumber(week.quantity)} 份</td>
                        <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(week.sales)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary-500 rounded-full"
                                style={{ width: `${Math.min(quantityPercent * 3, 100)}%` }}
                              />
                            </div>
                            <span className="text-gray-500 text-xs">{quantityPercent.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
