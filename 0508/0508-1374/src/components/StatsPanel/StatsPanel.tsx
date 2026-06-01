import { useAppStore } from '@/store/useAppStore';
import { SolutionChart } from './SolutionChart';
import { TrendingUp, Target, Footprints, Clock, Timer, Zap } from 'lucide-react';
import { SOLUTION_STATS } from '@/constants';

function formatTime(ms: number): string {
  if (ms < 1) return `${ms.toFixed(2)}ms`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(1);
  return `${minutes}m ${seconds}s`;
}

export function StatsPanel() {
  const {
    boardSize,
    solutions,
    foundSolutions,
    currentStepIndex,
    steps,
    isComplete,
    solveTime,
    animationElapsed,
  } = useAppStore();

  const progress = steps.length > 0 ? Math.round((currentStepIndex / (steps.length - 1)) * 100) : 0;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 space-y-6 border border-slate-700/50">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        统计信息
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Target className="w-3 h-3" />
            总解数
          </div>
          <div className="text-2xl font-bold text-indigo-400 font-mono">
            {solutions.length}
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <TrendingUp className="w-3 h-3" />
            已找到
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {foundSolutions}
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Footprints className="w-3 h-3" />
            执行步骤
          </div>
          <div className="text-lg font-bold text-amber-400 font-mono">
            {Math.max(0, currentStepIndex)}
            <span className="text-slate-500 text-sm">/{steps.length}</span>
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Clock className="w-3 h-3" />
            进度
          </div>
          <div className="text-lg font-bold text-cyan-400 font-mono">
            {progress}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/50 rounded-xl p-4 border border-indigo-500/30">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Zap className="w-3 h-3 text-indigo-400" />
            求解耗时
          </div>
          <div className="text-lg font-bold text-indigo-400 font-mono">
            {solveTime > 0 ? formatTime(solveTime) : '--'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            算法计算时间
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-xl p-4 border border-emerald-500/30">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Timer className="w-3 h-3 text-emerald-400" />
            动画耗时
          </div>
          <div className="text-lg font-bold text-emerald-400 font-mono">
            {animationElapsed > 0 ? formatTime(animationElapsed) : '--'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            演示播放时间
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-400">
          <span>执行进度</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
        <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          解数量增长趋势
        </h3>
        <SolutionChart />
      </div>

      <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
        <div className="text-xs text-slate-400 mb-2">算法说明</div>
        <p className="text-xs text-slate-500 leading-relaxed">
          使用回溯法逐行放置皇后。当检测到冲突（同列或对角线）时，
          回溯到上一行尝试下一个位置。找到一个解后继续寻找其他解，
          直到遍历完所有可能的布局。
        </p>
      </div>
    </div>
  );
}
