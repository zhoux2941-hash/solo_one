import { useAppStore } from '@/store/useAppStore';
import { SizeSelector } from './SizeSelector';
import { SpeedSlider } from './SpeedSlider';
import { Play, Pause, RotateCcw, StepForward, MousePointer2, FastForward } from 'lucide-react';
import { cn } from '@/utils/cn';

export function ControlPanel() {
  const {
    isRunning,
    isPaused,
    isStepMode,
    isComplete,
    setStepMode,
    startAnimation,
    pauseAnimation,
    resetAnimation,
    stepForward,
    currentDescription,
  } = useAppStore();

  const handleStartPause = () => {
    if (isComplete) {
      resetAnimation();
      setTimeout(() => startAnimation(), 100);
    } else if (isRunning) {
      pauseAnimation();
    } else {
      startAnimation();
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 space-y-6 border border-slate-700/50">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
        控制面板
      </h2>

      <SizeSelector />

      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <MousePointer2 className="w-4 h-4" />
          执行模式
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => !isRunning && setStepMode(false)}
            disabled={isRunning}
            className={cn(
              'px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
              !isStepMode
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600',
              isRunning && 'opacity-50 cursor-not-allowed'
            )}
          >
            <FastForward className="w-4 h-4" />
            自动播放
          </button>
          <button
            onClick={() => !isRunning && setStepMode(true)}
            disabled={isRunning}
            className={cn(
              'px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
              isStepMode
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600',
              isRunning && 'opacity-50 cursor-not-allowed'
            )}
          >
            <StepForward className="w-4 h-4" />
            单步执行
          </button>
        </div>
      </div>

      {!isStepMode && <SpeedSlider />}

      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-300">
          操作控制
        </label>
        <div className="flex gap-2">
          <button
            onClick={handleStartPause}
            className={cn(
              'flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2',
              isComplete
                ? 'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30'
                : isRunning
                ? 'bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/30'
                : 'bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/30'
            )}
          >
            {isComplete ? (
              <>
                <RotateCcw className="w-5 h-5" />
                重新开始
              </>
            ) : isRunning ? (
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
            onClick={resetAnimation}
            className="px-4 py-3 rounded-xl font-bold bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {isStepMode && (
          <button
            onClick={stepForward}
            disabled={isComplete}
            className={cn(
              'w-full px-4 py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2',
              isComplete
                ? 'bg-slate-600 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30'
            )}
          >
            <StepForward className="w-5 h-5" />
            下一步
          </button>
        )}
      </div>

      <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
        <div className="text-xs text-slate-400 mb-1">当前状态</div>
        <div className="text-sm text-slate-200 font-medium">
          {currentDescription}
        </div>
      </div>
    </div>
  );
}
