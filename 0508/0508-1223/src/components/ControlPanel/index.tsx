import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useHanoiStore } from '../../store/useHanoiStore';
import type { Speed } from '../../types/hanoi';

export const ControlPanel: React.FC = () => {
  const {
    isPlaying,
    speed,
    startAutoPlay,
    stopAutoPlay,
    setSpeed,
    reset,
    stepForward,
    stepBackward,
    currentStep,
    solutionSteps,
    diskCount,
    setDiskCount,
    isComplete
  } = useHanoiStore();

  const speedOptions: { value: Speed; label: string }[] = [
    { value: 'slow', label: '慢' },
    { value: 'medium', label: '中' },
    { value: 'fast', label: '快' }
  ];

  const handleDiskCountChange = (delta: number) => {
    const newCount = Math.max(3, Math.min(8, diskCount + delta));
    setDiskCount(newCount);
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-6 shadow-xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <label className="text-slate-300 font-medium">盘子数量</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleDiskCountChange(-1)}
              disabled={diskCount <= 3 || isPlaying}
              className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-white"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="w-8 text-center text-xl font-bold text-white">
              {diskCount}
            </span>
            <button
              onClick={() => handleDiskCountChange(1)}
              disabled={diskCount >= 8 || isPlaying}
              className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-white"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-slate-300 font-medium">动画速度</label>
          <div className="flex gap-1">
            {speedOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSpeed(option.value)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${speed === option.value
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-700 pt-4">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={stepBackward}
              disabled={currentStep <= 0 || isPlaying}
              className="p-3 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-white"
              title="上一步"
            >
              <SkipBack size={20} />
            </button>

            <button
              onClick={isPlaying ? stopAutoPlay : startAutoPlay}
              disabled={isComplete}
              className={`
                p-4 rounded-xl transition-all text-white
                ${isPlaying
                  ? 'bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-500/30'
                  : 'bg-green-500 hover:bg-green-400 shadow-lg shadow-green-500/30'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              title={isPlaying ? '暂停' : '自动播放'}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>

            <button
              onClick={stepForward}
              disabled={currentStep >= solutionSteps.length || isPlaying}
              className="p-3 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-white"
              title="下一步"
            >
              <SkipForward size={20} />
            </button>

            <button
              onClick={reset}
              className="p-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 transition-all ml-2"
              title="重置"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </div>

        <div className="text-center">
          <div className="text-slate-400 text-sm">
            步骤: <span className="text-white font-mono">{currentStep}</span>
            <span className="text-slate-500"> / </span>
            <span className="text-slate-300 font-mono">{solutionSteps.length}</span>
          </div>
          <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
              style={{ width: `${(currentStep / solutionSteps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
