import React from 'react';
import { Target, Footprints, TrendingUp, Award } from 'lucide-react';
import { useHanoiStore } from '../../store/useHanoiStore';

export const StatsPanel: React.FC = () => {
  const { totalSteps, manualSteps, optimalSteps, isComplete, diskCount } = useHanoiStore();

  const efficiency = totalSteps > 0 ? (optimalSteps / totalSteps) * 100 : 100;
  const ratio = totalSteps > 0 ? totalSteps / optimalSteps : 0;

  const getEfficiencyColor = () => {
    if (efficiency >= 90) return 'text-green-400';
    if (efficiency >= 70) return 'text-yellow-400';
    return 'text-rose-400';
  };

  const getEfficiencyBg = () => {
    if (efficiency >= 90) return 'from-green-500 to-emerald-400';
    if (efficiency >= 70) return 'from-yellow-500 to-amber-400';
    return 'from-rose-500 to-red-400';
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-6 shadow-xl">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Target size={20} className="text-blue-400" />
        统计信息
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Footprints size={14} />
            总步数
          </div>
          <div className="text-3xl font-bold text-white">{totalSteps}</div>
        </div>

        <div className="bg-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Award size={14} />
            最优步数
          </div>
          <div className="text-3xl font-bold text-cyan-400">{optimalSteps}</div>
          <div className="text-xs text-slate-500">2^{diskCount} - 1</div>
        </div>

        <div className="bg-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <TrendingUp size={14} />
            操作效率
          </div>
          <div className={`text-2xl font-bold ${getEfficiencyColor()}`}>
            {efficiency.toFixed(1)}%
          </div>
        </div>

        <div className="bg-slate-700/50 rounded-xl p-4">
          <div className="text-slate-400 text-sm mb-1">步数比例</div>
          <div className="text-xl font-bold text-white">
            {ratio > 0 ? ratio.toFixed(2) : '-'}
            <span className="text-sm text-slate-500 ml-1">倍</span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">优化进度</span>
          <span className={getEfficiencyColor()}>{efficiency.toFixed(1)}%</span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${getEfficiencyBg()} transition-all duration-500`}
            style={{ width: `${Math.min(100, efficiency)}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-slate-500">
          {totalSteps === 0
            ? '开始移动盘子来测试你的效率！'
            : efficiency >= 100
            ? '🎉 完美！你找到了最优解！'
            : `还有 ${totalSteps - optimalSteps} 步可以优化`
          }
        </div>
      </div>

      {isComplete && (
        <div className="mt-4 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
          <div className="text-center">
            <div className="text-2xl mb-1">🎊</div>
            <div className="text-green-400 font-bold">恭喜完成！</div>
            <div className="text-sm text-slate-400 mt-1">
              使用 {totalSteps} 步完成
              {efficiency >= 100 && <span className="text-green-400 ml-1">（最优解）</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
