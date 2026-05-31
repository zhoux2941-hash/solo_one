import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Wallet, AlertTriangle } from 'lucide-react';
import { getMonthKey, getPrevMonthKey, formatMoney, CATEGORIES } from '@/lib/constants';
import { useExpenseStore } from '@/store/expenseStore';
import { useBudgetStore } from '@/store/budgetStore';
import { useTheme } from '@/hooks/useTheme';
import MonthPicker from '@/components/MonthPicker';
import CategoryBarChart from '@/components/CategoryBarChart';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { isDark } = useTheme();
  const { expenses, getCategoryStats, getMonthTotal } = useExpenseStore();
  const { budgets } = useBudgetStore();

  const [selectedMonth, setSelectedMonth] = useState(() => getMonthKey(new Date()));

  const currentTotal = getMonthTotal(selectedMonth);
  const prevMonthKey = getPrevMonthKey(selectedMonth);
  const prevTotal = getMonthTotal(prevMonthKey);

  const currentStats = getCategoryStats(selectedMonth);
  const prevExpenses = expenses.filter((e) => e.date.startsWith(prevMonthKey));

  const changePercent =
    prevTotal === 0
      ? currentTotal > 0
        ? 100
        : 0
      : ((currentTotal - prevTotal) / prevTotal) * 100;

  const isUp = changePercent > 0;
  const isDown = changePercent < 0;

  const totalBudget = CATEGORIES.reduce(
    (sum, cat) => sum + (budgets.find((b) => b.category === cat.key)?.amount || 0),
    0
  );

  const hasData = Object.values(currentStats).some((v) => v > 0);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className={cn(
            'rounded-2xl p-5 border relative overflow-hidden',
            isDark ? 'bg-[#16213e] border-[#2a2a4a]' : 'bg-white border-gray-200 shadow-sm'
          )}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-bl-full" />
          <p className={cn('text-xs font-medium mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>当月总支出</p>
          <p className="text-2xl font-bold tracking-tight">¥{formatMoney(currentTotal)}</p>
          <div className="flex items-center gap-1.5 mt-2">
            {isUp ? (
              <TrendingUp className="w-4 h-4 text-red-500" />
            ) : isDown ? (
              <TrendingDown className="w-4 h-4 text-emerald-500" />
            ) : (
              <Minus className="w-4 h-4 text-gray-400" />
            )}
            <span
              className={cn(
                'text-xs font-semibold',
                isUp ? 'text-red-500' : isDown ? 'text-emerald-500' : 'text-gray-400'
              )}
            >
              {isUp ? '+' : ''}{changePercent.toFixed(1)}%
            </span>
            <span className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>环比上月</span>
          </div>
        </div>

        <div
          className={cn(
            'rounded-2xl p-5 border relative overflow-hidden',
            isDark ? 'bg-[#16213e] border-[#2a2a4a]' : 'bg-white border-gray-200 shadow-sm'
          )}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full" />
          <p className={cn('text-xs font-medium mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>上月总支出</p>
          <p className="text-2xl font-bold tracking-tight">¥{formatMoney(prevTotal)}</p>
          <div className={cn('text-xs mt-2', isDark ? 'text-gray-500' : 'text-gray-400')}>
            {prevExpenses.length} 笔记录
          </div>
        </div>

        <div
          className={cn(
            'rounded-2xl p-5 border relative overflow-hidden',
            isDark ? 'bg-[#16213e] border-[#2a2a4a]' : 'bg-white border-gray-200 shadow-sm'
          )}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full" />
          <p className={cn('text-xs font-medium mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>月度预算</p>
          <p className="text-2xl font-bold tracking-tight">¥{formatMoney(totalBudget)}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <Wallet className="w-4 h-4 text-emerald-500" />
            <span
              className={cn(
                'text-xs font-semibold',
                totalBudget > 0 && currentTotal > totalBudget
                  ? 'text-red-500'
                  : 'text-emerald-500'
              )}
            >
              {totalBudget > 0
                ? `已用 ${Math.round((currentTotal / totalBudget) * 100)}%`
                : '未设置预算'}
            </span>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'rounded-2xl p-6 border',
          isDark ? 'bg-[#16213e] border-[#2a2a4a]' : 'bg-white border-gray-200 shadow-sm'
        )}
      >
        <h2 className="text-lg font-bold mb-1">分类支出统计</h2>
        <p className={cn('text-xs mb-4', isDark ? 'text-gray-400' : 'text-gray-500')}>
          当月各分类开销分布
        </p>
        <CategoryBarChart monthKey={selectedMonth} />
      </div>

      {hasData && (
        <div
          className={cn(
            'rounded-2xl p-6 border',
            isDark ? 'bg-[#16213e] border-[#2a2a4a]' : 'bg-white border-gray-200 shadow-sm'
          )}
        >
          <h2 className="text-lg font-bold mb-4">分类明细</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CATEGORIES.map((cat) => {
              const catTotal = currentStats[cat.key] || 0;
              if (catTotal === 0) return null;
              const budget = budgets.find((b) => b.category === cat.key)?.amount || 0;
              const pct = currentTotal > 0 ? (catTotal / currentTotal) * 100 : 0;
              const budgetPct = budget > 0 ? (catTotal / budget) * 100 : 0;
              const isWarning = budget > 0 && budgetPct >= 80 && budgetPct < 100;
              const isDanger = budget > 0 && budgetPct >= 100;
              let statusColor = cat.color;
              if (isWarning) statusColor = '#F97316';
              if (isDanger) statusColor = '#EF4444';

              return (
                <div
                  key={cat.key}
                  className={cn(
                    'rounded-xl p-4 border transition-all',
                    isDark ? 'bg-[#1a1a2e] border-[#2a2a4a]' : 'bg-gray-50 border-gray-200',
                    isDanger && (isDark ? 'border-red-500/40' : 'border-red-300'),
                    isWarning && !isDanger && (isDark ? 'border-orange-500/40' : 'border-orange-300')
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: statusColor }}
                      />
                      <span className="text-sm font-medium">{cat.label}</span>
                    </div>
                    {(isWarning || isDanger) && (
                      <AlertTriangle
                        className={cn(
                          'w-4 h-4',
                          isDanger ? 'text-red-500' : 'text-orange-500'
                        )}
                      />
                    )}
                  </div>
                  <p className="text-lg font-bold">¥{formatMoney(catTotal)}</p>
                  <div className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>
                    占比 {pct.toFixed(1)}%
                    {budget > 0 && ` · 预算 ${budgetPct.toFixed(0)}%`}
                  </div>
                  {budget > 0 && (
                    <div className="mt-2 h-1.5 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(budgetPct, 100)}%`,
                          backgroundColor: statusColor,
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
