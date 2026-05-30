import { Play, Pause, RotateCcw, StepForward } from 'lucide-react';

interface SimulationControlsProps {
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  hasFire: boolean;
}

export function SimulationControls({
  isRunning,
  onStart,
  onPause,
  onStep,
  onReset,
  hasFire,
}: SimulationControlsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={isRunning ? onPause : onStart}
          disabled={!hasFire && !isRunning}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium
            transition-all duration-200
            ${isRunning
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-lg hover:shadow-xl active:scale-95`}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5" />
              暂停
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              开始
            </>
          )}
        </button>

        <button
          onClick={onStep}
          disabled={!hasFire || isRunning}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium
            bg-slate-600 hover:bg-slate-500 text-white
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            shadow-lg hover:shadow-xl active:scale-95"
        >
          <StepForward className="w-5 h-5" />
          单步
        </button>

        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium
            bg-red-500/80 hover:bg-red-500 text-white
            transition-all duration-200
            shadow-lg hover:shadow-xl active:scale-95"
        >
          <RotateCcw className="w-5 h-5" />
          重置
        </button>
      </div>

      {!hasFire && !isRunning && (
        <div className="text-center text-sm text-amber-400 bg-amber-500/10 rounded-lg py-2 px-4">
          💡 点击网格中的树木点燃火源
        </div>
      )}
    </div>
  );
}
