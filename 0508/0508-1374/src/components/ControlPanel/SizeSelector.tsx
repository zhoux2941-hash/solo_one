import { useAppStore } from '@/store/useAppStore';
import { MIN_BOARD_SIZE, MAX_BOARD_SIZE } from '@/constants';
import { cn } from '@/utils/cn';

export function SizeSelector() {
  const { boardSize, setBoardSize, isRunning } = useAppStore();

  const sizes = Array.from(
    { length: MAX_BOARD_SIZE - MIN_BOARD_SIZE + 1 },
    (_, i) => MIN_BOARD_SIZE + i
  );

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-slate-300">
        棋盘大小
      </label>
      <div className="grid grid-cols-5 gap-2">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => !isRunning && setBoardSize(size)}
            disabled={isRunning}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-bold transition-all',
              boardSize === size
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600',
              isRunning && 'opacity-50 cursor-not-allowed'
            )}
          >
            {size}×{size}
          </button>
        ))}
      </div>
    </div>
  );
}
