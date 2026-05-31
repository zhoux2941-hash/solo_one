import { useTasksStore } from '../store/useTasksStore';
import { getWeekdayShort, getDayOfMonth, isToday } from '../utils/dateUtils';
import { cn } from '../lib/utils';

export const WeeklyStats = () => {
  const { weeklyStats, currentDate, setDate } = useTasksStore();

  if (!weeklyStats) {
    return (
      <div className="h-32 bg-white rounded-t-3xl border-t border-x border-cream-200 animate-pulse" />
    );
  }

  const { percentage, completedCount, totalCount, dailyStats } = weeklyStats;

  return (
    <div className="bg-white border-t border-x border-cream-200 rounded-t-3xl shadow-lg">
      <div className="max-w-xl mx-auto px-6 py-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-ink-600">本周完成率</span>
            <span className="text-2xl font-serif font-semibold text-mint-600">
              {percentage}%
            </span>
          </div>
          <div className="text-sm text-ink-600">
            {completedCount} / {totalCount} 件事
          </div>
        </div>

        <div className="relative h-2 bg-cream-100 rounded-full overflow-hidden mb-5">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-mint-400 to-mint-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex justify-between items-end">
          {dailyStats.map((stat) => {
            const dayPercentage = stat.total > 0 ? (stat.completed / stat.total) * 100 : 0;
            const isSelected = stat.date === currentDate;
            const isCurrentDay = isToday(stat.date);

            return (
              <button
                key={stat.date}
                onClick={() => setDate(stat.date)}
                className={cn(
                  'flex flex-col items-center gap-1.5 transition-all duration-200',
                  'opacity-0 animate-fade-in-up'
                )}
                style={{ animationDelay: `${dailyStats.indexOf(stat) * 50}ms` }}
              >
                <span
                  className={cn(
                    'text-xs transition-colors duration-200',
                    isSelected ? 'text-warm-500 font-medium' : 'text-ink-600'
                  )}
                >
                  {getWeekdayShort(stat.date)}
                </span>

                <div className="relative">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all duration-200',
                      isSelected
                        ? 'bg-warm-500 text-white scale-110 shadow-md'
                        : isCurrentDay
                        ? 'bg-cream-200 text-ink-700 font-medium'
                        : 'bg-cream-50 text-ink-600',
                      stat.completed > 0 && !isSelected && 'bg-mint-50 text-mint-600'
                    )}
                  >
                    {getDayOfMonth(stat.date)}
                  </div>

                  {stat.total > 0 && (
                    <div
                      className={cn(
                        'absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full',
                        dayPercentage === 100
                          ? 'bg-mint-500'
                          : dayPercentage > 0
                          ? 'bg-mint-300'
                          : 'bg-cream-200'
                      )}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
