import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle, ChevronRight } from 'lucide-react';
import type { DishStats, TabType } from '@/types';
import { formatCurrency, formatNumber, formatPercent, cn } from '@/utils';

interface DishCardProps {
  dish: DishStats;
  rank: number;
  tabType: TabType;
  onClick: () => void;
}

const rankColors = [
  'bg-gradient-to-br from-gold-400 to-gold-600 text-white',
  'bg-gradient-to-br from-gray-300 to-gray-500 text-white',
  'bg-gradient-to-br from-amber-600 to-amber-800 text-white',
];

export const DishCard: React.FC<DishCardProps> = ({ dish, rank, tabType, onClick }) => {
  const getBadgeIcon = () => {
    switch (tabType) {
      case 'star':
        return <TrendingUp className="w-4 h-4" />;
      case 'slow':
        return <TrendingDown className="w-4 h-4" />;
      case 'problem':
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getBadgeColor = () => {
    switch (tabType) {
      case 'star':
        return 'bg-gold-100 text-gold-700';
      case 'slow':
        return 'bg-gray-100 text-gray-600';
      case 'problem':
        return 'bg-accent-100 text-accent-700';
    }
  };

  const getMarginColor = () => {
    if (dish.totalQuantity === 0) return 'text-gray-400';
    if (dish.profitMargin >= 0.5) return 'text-emerald-600';
    if (dish.profitMargin >= 0.3) return 'text-primary-600';
    if (dish.profitMargin >= 0.2) return 'text-amber-600';
    return 'text-accent-600';
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border border-gray-100 p-5 cursor-pointer',
        'card-shadow card-shadow-hover transition-all duration-300',
        'group'
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm',
            rank <= 3 ? rankColors[rank - 1] : 'bg-gray-100 text-gray-600'
          )}>
            {rank}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg group-hover:text-primary-600 transition-colors">
              {dish.dishName}
            </h3>
            <div className={cn(
              'inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium',
              getBadgeColor()
            )}>
              {getBadgeIcon()}
              <span>
                {tabType === 'star' && `销量第${rank}`}
                {tabType === 'slow' && (dish.totalQuantity === 0 ? '零销量' : `销量倒数第${rank}`)}
                {tabType === 'problem' && `毛利率过低`}
              </span>
            </div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">总销量</p>
          <p className="text-xl font-bold text-gray-900">{formatNumber(dish.totalQuantity)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">销售额</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(dish.totalSales)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">毛利</p>
          <p className="text-lg font-semibold text-gray-800">{formatCurrency(dish.totalProfit)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">毛利率</p>
          <p className={cn('text-lg font-semibold', getMarginColor())}>
            {formatPercent(dish.profitMargin)}
          </p>
        </div>
      </div>

      {dish.weeklyTrend.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">周销量趋势</span>
            <div className="flex-1 flex gap-0.5 items-end h-8">
              {dish.weeklyTrend.slice(-6).map((week, i) => {
                const maxQty = Math.max(...dish.weeklyTrend.map(w => w.quantity), 1);
                const height = maxQty > 0 ? (week.quantity / maxQty) * 100 : 0;
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-primary-200 group-hover:bg-primary-400 transition-colors"
                    style={{ height: `${height > 0 ? Math.max(height, 10) : 4}%` }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
