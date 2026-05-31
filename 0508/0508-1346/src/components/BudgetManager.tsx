import { useEffect, useState } from 'react';
import {
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  Save,
  AlertTriangle,
  X,
} from 'lucide-react';
import { CATEGORIES, CATEGORY_MAP, formatMoney } from '@/lib/constants';
import { useExpenseStore } from '@/store/expenseStore';
import { useBudgetStore } from '@/store/budgetStore';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ElementType> = {
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Gamepad2,
  HeartPulse,
  GraduationCap,
};

interface BudgetManagerProps {
  selectedMonth: string;
}

export default function BudgetManager({ selectedMonth }: BudgetManagerProps) {
  const { isDark } = useTheme();
  const { expenses, getCategoryStats } = useExpenseStore();
  const { budgets, setBudget } = useBudgetStore();

  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [alerts, setAlerts] = useState<{ category: string; level: 'warning' | 'danger'; spent: number; budget: number }[]>([]);
  const [showAlertModal, setShowAlertModal] = useState(false);

  const monthStats = getCategoryStats(selectedMonth);
  const monthExpenses = expenses.filter((e) => e.date.startsWith(selectedMonth));

  useEffect(() => {
    const newAlerts: typeof alerts = [];
    for (const cat of CATEGORIES) {
      const budget = budgets.find((b) => b.category === cat.key)?.amount || 0;
      if (budget <= 0) continue;
      const spent = monthStats[cat.key] || 0;
      if (spent >= budget) {
        newAlerts.push({ category: cat.key, level: 'danger', spent, budget });
      } else if (spent >= budget * 0.8) {
        newAlerts.push({ category: cat.key, level: 'warning', spent, budget });
      }
    }
    setAlerts(newAlerts);
  }, [expenses, budgets, selectedMonth, monthStats, monthExpenses]);

  useEffect(() => {
    if (alerts.length > 0 && alerts.some((a) => a.level === 'danger')) {
      setShowAlertModal(true);
    }
  }, [alerts]);

  function handleBudgetChange(category: string, value: string) {
    setEditValues((prev) => ({ ...prev, [category]: value }));
  }

  function handleSave(category: string) {
    const val = parseFloat(editValues[category] ?? '');
    if (!isNaN(val) && val >= 0) {
      setBudget(category, val);
    }
  }

  return (
    <div className="space-y-6">
      {showAlertModal && alerts.some((a) => a.level === 'danger') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className={cn(
              'w-full max-w-md mx-4 rounded-2xl p-6 border shadow-2xl',
              isDark ? 'bg-[#1a1a2e] border-red-500/30' : 'bg-white border-red-200'
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-red-500">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-lg">预算超标提醒</h3>
              </div>
              <button
                onClick={() => setShowAlertModal(false)}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  isDark ? 'hover:bg-[#2a2a4a]' : 'hover:bg-gray-100'
                )}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {alerts
                .filter((a) => a.level === 'danger')
                .map((alert) => {
                  const cat = CATEGORY_MAP[alert.category];
                  return (
                    <div
                      key={alert.category}
                      className={cn(
                        'px-4 py-3 rounded-xl border',
                        isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'
                      )}
                    >
                      <p className="text-sm font-medium text-red-500">
                        {cat?.label || alert.category} 已超出预算！
                      </p>
                      <p className={cn('text-xs mt-1', isDark ? 'text-gray-400' : 'text-gray-500')}>
                        已花费 ¥{formatMoney(alert.spent)}，预算 ¥{formatMoney(alert.budget)}，超出
                        ¥{formatMoney(alert.spent - alert.budget)}
                      </p>
                    </div>
                  );
                })}
            </div>
            <button
              onClick={() => setShowAlertModal(false)}
              className="w-full mt-4 py-2.5 rounded-xl bg-red-500 text-white font-medium text-sm hover:bg-red-600 transition-colors"
            >
              我知道了
            </button>
          </div>
        </div>
      )}

      <div
        className={cn(
          'rounded-2xl p-6 border',
          isDark ? 'bg-[#16213e] border-[#2a2a4a]' : 'bg-white border-gray-200 shadow-sm'
        )}
      >
        <h2 className="text-lg font-bold mb-1">预算设置</h2>
        <p className={cn('text-xs mb-5', isDark ? 'text-gray-400' : 'text-gray-500')}>
          为每个分类设置月预算，超出时将自动提醒
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CATEGORIES.map((cat) => {
            const Icon = ICON_MAP[cat.icon];
            const budget = budgets.find((b) => b.category === cat.key)?.amount || 0;
            const spent = monthStats[cat.key] || 0;
            const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
            const isOver = budget > 0 && spent >= budget;
            const isWarning = budget > 0 && spent >= budget * 0.8 && spent < budget;

            return (
              <div
                key={cat.key}
                className={cn(
                  'rounded-xl p-4 border transition-all',
                  isDark ? 'bg-[#1a1a2e] border-[#2a2a4a]' : 'bg-gray-50 border-gray-200',
                  isOver && (isDark ? 'border-red-500/40' : 'border-red-300'),
                  isWarning && !isOver && (isDark ? 'border-yellow-500/40' : 'border-yellow-300')
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${cat.color}20` }}
                  >
                    <Icon className="w-4.5 h-4.5" style={{ color: cat.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{cat.label}</div>
                    <div className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>
                      已花费 ¥{formatMoney(spent)}
                    </div>
                  </div>
                  {isOver && <AlertTriangle className="w-4 h-4 text-red-500" />}
                  {isWarning && !isOver && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                </div>

                {budget > 0 && (
                  <div className="mb-3">
                    <div className={cn('h-2 rounded-full overflow-hidden', isDark ? 'bg-[#2a2a4a]' : 'bg-gray-200')}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: isOver ? '#ef4444' : isWarning ? '#eab308' : cat.color,
                        }}
                      />
                    </div>
                    <div
                      className={cn(
                        'text-xs mt-1 text-right',
                        isOver ? 'text-red-500 font-medium' : isDark ? 'text-gray-500' : 'text-gray-400'
                      )}
                    >
                      {Math.round((spent / budget) * 100)}%
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span
                      className={cn(
                        'absolute left-3 top-1/2 -translate-y-1/2 text-xs',
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      )}
                    >
                      ¥
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={editValues[cat.key] ?? (budget > 0 ? budget : '')}
                      onChange={(e) => handleBudgetChange(cat.key, e.target.value)}
                      placeholder="设置预算"
                      className={cn(
                        'w-full pl-7 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition',
                        isDark
                          ? 'bg-[#16213e] border-[#2a2a4a] text-gray-200 placeholder-gray-600'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                      )}
                    />
                  </div>
                  <button
                    onClick={() => handleSave(cat.key)}
                    className="p-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {alerts.length > 0 && (
        <div
          className={cn(
            'rounded-2xl p-6 border',
            isDark ? 'bg-[#16213e] border-[#2a2a4a]' : 'bg-white border-gray-200 shadow-sm'
          )}
        >
          <h2 className="text-lg font-bold mb-4">预算提醒</h2>
          <div className="space-y-2">
            {alerts.map((alert) => {
              const cat = CATEGORY_MAP[alert.category];
              const isDanger = alert.level === 'danger';
              return (
                <div
                  key={alert.category}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl',
                    isDanger
                      ? isDark
                        ? 'bg-red-500/10 border border-red-500/20'
                        : 'bg-red-50 border border-red-200'
                      : isDark
                        ? 'bg-yellow-500/10 border border-yellow-500/20'
                        : 'bg-yellow-50 border border-yellow-200'
                  )}
                >
                  <AlertTriangle
                    className={cn('w-5 h-5 shrink-0', isDanger ? 'text-red-500' : 'text-yellow-500')}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        isDanger ? 'text-red-500' : 'text-yellow-600'
                      )}
                    >
                      {cat?.label}
                      {isDanger ? ' 已超出预算' : ' 接近预算上限'}
                    </p>
                    <p className={cn('text-xs mt-0.5', isDark ? 'text-gray-400' : 'text-gray-500')}>
                      已花费 ¥{formatMoney(alert.spent)} / 预算 ¥{formatMoney(alert.budget)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
