import React, { useState } from 'react';
import { Play, StepForward, RotateCcw, Pause, Check } from 'lucide-react';
import { Speed, MIN_N, MAX_N } from '@/types';
import { SieveEngine } from '@/utils/sieveEngine';

interface ControlPanelProps {
  n: number;
  speed: Speed;
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  hasGrid: boolean;
  onNChange: (n: number) => void;
  onGenerate: () => void;
  onSpeedChange: (speed: Speed) => void;
  onStart: () => void;
  onStep: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  n,
  speed,
  isRunning,
  isPaused,
  isCompleted,
  hasGrid,
  onNChange,
  onGenerate,
  onSpeedChange,
  onStart,
  onStep,
  onPause,
  onResume,
  onReset,
}) => {
  const [inputValue, setInputValue] = useState(n.toString());
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setError(null);
  };

  const handleGenerate = () => {
    const parsed = parseInt(inputValue, 10);
    if (!SieveEngine.validateN(parsed, MIN_N, MAX_N)) {
      setError(`请输入 ${MIN_N} 到 ${MAX_N} 之间的整数`);
      return;
    }
    onNChange(parsed);
    onGenerate();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGenerate();
    }
  };

  const speeds: { value: Speed; label: string }[] = [
    { value: 'slow', label: '慢' },
    { value: 'medium', label: '中' },
    { value: 'fast', label: '快' },
  ];

  return (
    <div className="card space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">🔢</span>
          控制面板
        </h2>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-300">
          输入 N 值 （{MIN_N} - {MAX_N}）
        </label>
        <div className="flex gap-3">
          <input
            type="number"
            min={MIN_N}
            max={MAX_N}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="input-field flex-1"
            placeholder={`请输入 ${MIN_N}-${MAX_N}`}
            disabled={isRunning}
          />
          <button
            onClick={handleGenerate}
            disabled={isRunning}
            className="btn-secondary"
          >
            生成网格
          </button>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-300">动画速度</label>
        <div className="flex gap-2 bg-surface-light/50 rounded-full p-1">
          {speeds.map((s) => (
            <button
              key={s.value}
              onClick={() => onSpeedChange(s.value)}
              className={`speed-btn flex-1 ${speed === s.value ? 'active' : ''}`}
              disabled={isRunning}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-300">操作控制</label>
        <div className="flex flex-wrap gap-3">
          {!hasGrid ? (
            <button className="btn-primary opacity-50 cursor-not-allowed" disabled>
              <Play className="w-4 h-4 inline mr-2" />
              请先生成网格
            </button>
          ) : isCompleted ? (
            <button onClick={onReset} className="btn-primary">
              <RotateCcw className="w-4 h-4 inline mr-2" />
              重新开始
            </button>
          ) : isPaused ? (
            <button onClick={onResume} className="btn-primary">
              <Play className="w-4 h-4 inline mr-2" />
              继续
            </button>
          ) : isRunning ? (
            <button onClick={onPause} className="btn-secondary">
              <Pause className="w-4 h-4 inline mr-2" />
              暂停
            </button>
          ) : (
            <button onClick={onStart} className="btn-primary">
              <Play className="w-4 h-4 inline mr-2" />
              开始动画
            </button>
          )}

          {hasGrid && !isCompleted && (
            <button
              onClick={onStep}
              disabled={isRunning && !isPaused}
              className="btn-secondary"
            >
              <StepForward className="w-4 h-4 inline mr-2" />
              单步执行
            </button>
          )}

          {hasGrid && (
            <button
              onClick={onReset}
              disabled={isRunning && !isPaused}
              className="btn-ghost"
            >
              <RotateCcw className="w-4 h-4 inline mr-2" />
              重置
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-prime/20 border border-prime/50" />
          <span className="text-sm text-slate-400">素数</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-current/25 border border-current/60 animate-pulse" />
          <span className="text-sm text-slate-400">当前处理</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-surface/30 border border-slate-700/30 relative">
            <span className="absolute left-0 top-1/2 w-full h-0.5 bg-composite-line transform -translate-y-1/2" />
          </div>
          <span className="text-sm text-slate-400">合数</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-surface/50 border border-slate-700/30" />
          <span className="text-sm text-slate-400">未处理</span>
        </div>
      </div>
    </div>
  );
};
