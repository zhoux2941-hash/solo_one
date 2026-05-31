import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMonthKey, getMonthLabel, getPrevMonthKey } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';

interface MonthPickerProps {
  value: string;
  onChange: (monthKey: string) => void;
}

export default function MonthPicker({ value, onChange }: MonthPickerProps) {
  const { isDark } = useTheme();

  function handlePrev() {
    onChange(getPrevMonthKey(value));
  }

  function handleNext() {
    const [y, m] = value.split('-').map(Number);
    const nextMonth = m === 12 ? 1 : m + 1;
    const nextYear = m === 12 ? y + 1 : y;
    onChange(`${nextYear}-${String(nextMonth).padStart(2, '0')}`);
  }

  function handleToday() {
    onChange(getMonthKey(new Date()));
  }

  const isCurrentMonth = value === getMonthKey(new Date());

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handlePrev}
        className={cn(
          'p-2 rounded-lg transition-all',
          isDark ? 'hover:bg-[#2a2a4a] text-gray-400' : 'hover:bg-gray-100 text-gray-500'
        )}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <span className="text-lg font-bold min-w-[120px] text-center">{getMonthLabel(value)}</span>
      <button
        onClick={handleNext}
        className={cn(
          'p-2 rounded-lg transition-all',
          isDark ? 'hover:bg-[#2a2a4a] text-gray-400' : 'hover:bg-gray-100 text-gray-500'
        )}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      {!isCurrentMonth && (
        <button
          onClick={handleToday}
          className="ml-2 px-3 py-1.5 text-xs rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium"
        >
          回到本月
        </button>
      )}
    </div>
  );
}
