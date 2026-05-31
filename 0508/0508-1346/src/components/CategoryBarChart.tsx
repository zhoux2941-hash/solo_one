import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { CATEGORIES, formatMoney } from '@/lib/constants';
import { useExpenseStore } from '@/store/expenseStore';
import { useBudgetStore } from '@/store/budgetStore';
import { useTheme } from '@/hooks/useTheme';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryBarChartProps {
  monthKey: string;
}

export default function CategoryBarChart({ monthKey }: CategoryBarChartProps) {
  const { isDark } = useTheme();
  const getCategoryStats = useExpenseStore((s) => s.getCategoryStats);
  const stats = getCategoryStats(monthKey);
  const { budgets } = useBudgetStore();

  const getStatusInfo = (categoryKey: string, total: number) => {
    const budget = budgets.find((b) => b.category === categoryKey)?.amount || 0;
    if (budget <= 0) {
      return { status: 'normal' as const, pct: 0, budget };
    }
    const pct = (total / budget) * 100;
    if (pct >= 100) return { status: 'danger' as const, pct, budget };
    if (pct >= 80) return { status: 'warning' as const, pct, budget };
    return { status: 'normal' as const, pct, budget };
  };

  const data = CATEGORIES.map((cat) => {
    const total = Math.round((stats[cat.key] || 0) * 100) / 100;
    const statusInfo = getStatusInfo(cat.key, total);

    let barColor = cat.color;
    if (statusInfo.status === 'warning') barColor = '#F97316';
    if (statusInfo.status === 'danger') barColor = '#EF4444';

    return {
      name: cat.label,
      key: cat.key,
      total,
      originalColor: cat.color,
      color: barColor,
      status: statusInfo.status,
      pct: statusInfo.pct,
      budget: statusInfo.budget,
    };
  }).filter((d) => d.total > 0);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        暂无数据
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 20, right: 20, bottom: 5, left: 20 }}>
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 13 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
            tickFormatter={(v) => `¥${v}`}
          />
          <Tooltip
            formatter={(value: number, _name: unknown, props: { payload: { budget: number; pct: number } }) => {
              const { budget, pct } = props.payload;
              return [
                `¥${formatMoney(value)}${budget > 0 ? ` (${pct.toFixed(1)}% 预算)` : ''}`,
                '支出',
              ];
            }}
            contentStyle={{
              backgroundColor: isDark ? '#1e2a4a' : '#fff',
              border: isDark ? '1px solid #2a2a4a' : '1px solid #e5e7eb',
              borderRadius: '12px',
              color: isDark ? '#e5e7eb' : '#1f2937',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            }}
            cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}
          />
          <Bar
            dataKey="total"
            radius={[8, 8, 0, 0]}
            maxBarSize={56}
            animationDuration={400}
          >
            <LabelList
              dataKey="total"
              position="top"
              formatter={(v: number) => `¥${formatMoney(v)}`}
              fill={isDark ? '#e5e7eb' : '#374151'}
              fontSize={11}
              fontWeight={600}
            />
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.color}
                fillOpacity={entry.status === 'normal' ? 0.85 : 1}
                style={{
                  filter: entry.status !== 'normal'
                    ? `drop-shadow(0 0 6px ${entry.color}80)`
                    : undefined,
                }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
        {data.some((d) => d.status !== 'normal') && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-gray-500 dark:text-gray-400">预算状态：</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-orange-500 font-medium">≥80% 预警</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-red-500 font-medium">≥100% 超标</span>
            </div>
          </div>
        )}
      </div>

      {data.some((d) => d.status !== 'normal') && (
        <div className="space-y-2">
          {data
            .filter((d) => d.status !== 'normal')
            .map((item) => (
              <div
                key={item.key}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl border',
                  item.status === 'danger'
                    ? isDark
                      ? 'bg-red-500/10 border-red-500/20'
                      : 'bg-red-50 border-red-200'
                    : isDark
                      ? 'bg-orange-500/10 border-orange-500/20'
                      : 'bg-orange-50 border-orange-200'
                )}
              >
                <AlertTriangle
                  className={cn(
                    'w-5 h-5 shrink-0',
                    item.status === 'danger' ? 'text-red-500' : 'text-orange-500'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      item.status === 'danger' ? 'text-red-500' : 'text-orange-500'
                    )}
                  >
                    {item.name}
                    {item.status === 'danger' ? ' 已超出预算' : ' 接近预算上限'}
                  </p>
                  <p className={cn('text-xs mt-0.5', isDark ? 'text-gray-400' : 'text-gray-500')}>
                    已花费 ¥{formatMoney(item.total)} / 预算 ¥{formatMoney(item.budget)} ({item.pct.toFixed(1)}%)
                  </p>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
