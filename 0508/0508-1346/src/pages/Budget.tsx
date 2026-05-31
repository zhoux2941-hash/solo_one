import { useState } from 'react';
import { getMonthKey } from '@/lib/constants';
import { useTheme } from '@/hooks/useTheme';
import MonthPicker from '@/components/MonthPicker';
import BudgetManager from '@/components/BudgetManager';

export default function Budget() {
  const { isDark } = useTheme();
  const [selectedMonth, setSelectedMonth] = useState(() => getMonthKey(new Date()));

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <div
        className={`text-xs px-4 py-2.5 rounded-xl ${isDark ? 'bg-[#16213e] text-gray-400 border border-[#2a2a4a]' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}
      >
        📊 为各分类设置月预算后，系统将自动检测并提醒超支情况
      </div>

      <BudgetManager selectedMonth={selectedMonth} />
    </div>
  );
}
