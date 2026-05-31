import { useState } from 'react';
import { getMonthKey } from '@/lib/constants';
import { useTheme } from '@/hooks/useTheme';
import MonthPicker from '@/components/MonthPicker';
import ExpenseForm from '@/components/ExpenseForm';

export default function Expenses() {
  const { isDark } = useTheme();
  const [selectedMonth, setSelectedMonth] = useState(() => getMonthKey(new Date()));

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <div
        className={`text-xs px-4 py-2.5 rounded-xl ${isDark ? 'bg-[#16213e] text-gray-400 border border-[#2a2a4a]' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}
      >
        💡 选择月份后，可查看和添加对应月份的开销记录
      </div>

      <ExpenseForm selectedMonth={selectedMonth} />
    </div>
  );
}
