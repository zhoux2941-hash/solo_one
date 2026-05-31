import React from 'react';
import { Activity } from 'lucide-react';

interface StatusBarProps {
  currentPrime: number | null;
  stepsCompleted: number;
  totalSteps: number;
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  n: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  currentPrime,
  stepsCompleted,
  totalSteps,
  isRunning,
  isPaused,
  isCompleted,
  n,
}) => {
  const progress = totalSteps > 0 ? (stepsCompleted / totalSteps) * 100 : 0;

  const getStatusText = () => {
    if (isCompleted) {
      return '✓ 筛选完成';
    }
    if (isPaused) {
      return '⏸ 已暂停';
    }
    if (isRunning) {
      return '▶ 正在运行...';
    }
    if (currentPrime === null) {
      return 'ℹ 等待开始';
    }
    return `处理素数: ${currentPrime}`;
  };

  const getStatusColor = () => {
    if (isCompleted) return 'text-emerald-400';
    if (isPaused) return 'text-amber-400';
    if (isRunning) return 'text-emerald-400';
    return 'text-slate-400';
  };

  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Activity className={`w-5 h-5 ${isRunning ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
          <div>
            <p className="text-sm text-slate-400">当前状态</p>
            <p className={`font-semibold ${getStatusColor()}`}>
              {getStatusText()}
            </p>
          </div>
        </div>

        {currentPrime !== null && !isCompleted && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-current/25 border-2 border-current/60 flex items-center justify-center animate-pulse">
              <span className="font-mono font-bold text-current">{currentPrime}</span>
            </div>
            <div>
              <p className="text-sm text-slate-400">当前素数</p>
              <p className="font-mono font-bold text-current">{currentPrime}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm text-slate-400">进度</p>
            <p className="font-mono font-semibold text-white">
              {stepsCompleted} / {totalSteps} 步
            </p>
          </div>
          <div className="w-32 h-2 bg-surface-light rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm text-slate-400">筛选范围</p>
            <p className="font-mono font-semibold text-white">0 - {n}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-prime/20 border border-prime/50 flex items-center justify-center">
            <span className="font-mono font-bold text-prime">√N</span>
          </div>
          <div>
            <p className="text-sm text-slate-400">筛选终止条件</p>
            <p className="font-mono font-semibold text-white">
              p ≤ {Math.sqrt(n).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
