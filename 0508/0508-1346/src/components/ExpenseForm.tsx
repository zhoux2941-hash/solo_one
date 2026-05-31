import { useState } from 'react';
import {
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  Plus,
  Trash2,
} from 'lucide-react';
import { CATEGORIES, CATEGORY_MAP, formatMoney } from '@/lib/constants';
import { useExpenseStore } from '@/store/expenseStore';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import type { Expense } from '@/lib/constants';

const ICON_MAP: Record<string, React.ElementType> = {
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Gamepad2,
  HeartPulse,
  GraduationCap,
};

interface ExpenseFormProps {
  selectedMonth: string;
}

export default function ExpenseForm({ selectedMonth }: ExpenseFormProps) {
  const { isDark } = useTheme();
  const { expenses, addExpense, removeExpense } = useExpenseStore();

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].key);
  const [note, setNote] = useState('');

  const monthExpenses = expenses
    .filter((e) => e.date.startsWith(selectedMonth))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    addExpense({ date, amount: amt, category, note });
    setAmount('');
    setNote('');
  }

  function handleDelete(id: string) {
    removeExpense(id);
  }

  return (
    <div className="space-y-6">
      <div
        className={cn(
          'rounded-2xl p-6 border',
          isDark ? 'bg-[#16213e] border-[#2a2a4a]' : 'bg-white border-gray-200 shadow-sm'
        )}
      >
        <h2 className="text-lg font-bold mb-4">添加开销</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={cn('text-xs font-medium mb-1.5 block', isDark ? 'text-gray-400' : 'text-gray-500')}>
                日期
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition',
                  isDark
                    ? 'bg-[#1a1a2e] border-[#2a2a4a] text-gray-200'
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                )}
              />
            </div>
            <div>
              <label className={cn('text-xs font-medium mb-1.5 block', isDark ? 'text-gray-400' : 'text-gray-500')}>
                金额 (¥)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition',
                  isDark
                    ? 'bg-[#1a1a2e] border-[#2a2a4a] text-gray-200'
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                )}
              />
            </div>
          </div>

          <div>
            <label className={cn('text-xs font-medium mb-2 block', isDark ? 'text-gray-400' : 'text-gray-500')}>
              分类
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = ICON_MAP[cat.icon] || Plus;
                const active = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategory(cat.key)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border',
                      active
                        ? 'border-transparent text-white shadow-lg'
                        : isDark
                          ? 'border-[#2a2a4a] text-gray-400 hover:border-gray-600'
                          : 'border-gray-200 text-gray-600 hover:border-gray-400'
                    )}
                    style={
                      active
                        ? { backgroundColor: cat.color, boxShadow: `0 4px 14px ${cat.color}40` }
                        : undefined
                    }
                  >
                    <Icon className="w-4 h-4" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={cn('text-xs font-medium mb-1.5 block', isDark ? 'text-gray-400' : 'text-gray-500')}>
              备注
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="可选，如：午餐、地铁充值"
              className={cn(
                'w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition',
                isDark
                  ? 'bg-[#1a1a2e] border-[#2a2a4a] text-gray-200 placeholder-gray-600'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
              )}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
          >
            添加记录
          </button>
        </form>
      </div>

      <div
        className={cn(
          'rounded-2xl p-6 border',
          isDark ? 'bg-[#16213e] border-[#2a2a4a]' : 'bg-white border-gray-200 shadow-sm'
        )}
      >
        <h2 className="text-lg font-bold mb-4">
          开销列表
          <span className={cn('text-sm font-normal ml-2', isDark ? 'text-gray-400' : 'text-gray-500')}>
            共 {monthExpenses.length} 笔
          </span>
        </h2>

        {monthExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <ReceiptIcon className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">本月暂无开销记录</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[480px] overflow-auto pr-1">
            {monthExpenses.map((expense) => (
              <ExpenseItem key={expense.id} expense={expense} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReceiptIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M8 7h8M8 11h8M8 15h4" />
    </svg>
  );
}

function ExpenseItem({ expense, onDelete }: { expense: Expense; onDelete: (id: string) => void }) {
  const { isDark } = useTheme();
  const cat = CATEGORY_MAP[expense.category];
  const Icon = ICON_MAP[cat?.icon] || Plus;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all group',
        isDark ? 'hover:bg-[#1e2a4a]' : 'hover:bg-gray-50'
      )}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${cat?.color || '#888'}20` }}
      >
        <Icon className="w-5 h-5" style={{ color: cat?.color || '#888' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">¥{formatMoney(expense.amount)}</span>
          <span className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>{expense.date}</span>
        </div>
        <div className={cn('text-xs mt-0.5 truncate', isDark ? 'text-gray-400' : 'text-gray-500')}>
          {cat?.label || expense.category}
          {expense.note && ` · ${expense.note}`}
        </div>
      </div>
      <button
        onClick={() => onDelete(expense.id)}
        className={cn(
          'p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all',
          isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-400'
        )}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
