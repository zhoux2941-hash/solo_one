import { ChevronLeft, ChevronRight, Calendar, Copy } from 'lucide-react';
import { useState } from 'react';
import { useTasksStore } from '../store/useTasksStore';
import { formatFullDisplayDate, isToday } from '../utils/dateUtils';

export const DateNavigator = () => {
  const { currentDate, tasks, goToPrevDay, goToNextDay, goToToday, copyToToday } = useTasksStore();
  const isCurrentToday = isToday(currentDate);
  const [showCopied, setShowCopied] = useState(false);

  const hasContent = tasks.some((t) => t.content.trim() !== '');

  const handleCopyToToday = async () => {
    await copyToToday();
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 1500);
  };

  return (
    <div className="flex flex-col items-center mb-8">
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={goToPrevDay}
          className="w-11 h-11 flex items-center justify-center rounded-full text-ink-600 hover:bg-cream-200 transition-all duration-200 active:scale-95"
          aria-label="前一天"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <h1 className="font-serif text-2xl md:text-3xl text-ink-800 font-semibold min-w-[240px] text-center">
          {formatFullDisplayDate(currentDate)}
        </h1>

        <button
          onClick={goToNextDay}
          className="w-11 h-11 flex items-center justify-center rounded-full text-ink-600 hover:bg-cream-200 transition-all duration-200 active:scale-95"
          aria-label="后一天"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {!isCurrentToday && (
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="flex items-center gap-2 px-4 py-2 text-sm text-warm-500 hover:text-warm-600 bg-warm-500/10 rounded-full transition-all duration-200 hover:bg-warm-500/20"
          >
            <Calendar className="w-4 h-4" />
            回到今天
          </button>

          {hasContent && (
            <button
              onClick={handleCopyToToday}
              className="flex items-center gap-2 px-4 py-2 text-sm text-mint-600 hover:text-mint-500 bg-mint-500/10 rounded-full transition-all duration-200 hover:bg-mint-500/20 active:scale-95"
            >
              <Copy className="w-4 h-4" />
              {showCopied ? '已复制' : '复制到今日'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
