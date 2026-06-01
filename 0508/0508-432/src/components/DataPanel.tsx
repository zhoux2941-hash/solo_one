import { useSimulationStore } from '@/store/simulationStore';
import { CheckCircle2, XCircle, TrendingDown, Activity } from 'lucide-react';

export default function DataPanel() {
  const { result, v1, v2, restitution, showResult } = useSimulationStore();

  if (!showResult || !result) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-5 text-center">
        <Activity size={32} className="text-zinc-700 mb-3" />
        <p className="text-sm text-zinc-600">开始碰撞后显示数据</p>
      </div>
    );
  }

  const isMomentumConserved = result.momentumDiff < 0.001;

  return (
    <div className="flex flex-col gap-4 p-5 bg-[#0d1225]/80 backdrop-blur-sm rounded-xl border border-cyan-900/20">
      <h2 className="text-sm font-semibold tracking-wider text-cyan-300 uppercase flex items-center gap-2">
        <TrendingDown size={16} className="text-cyan-400" />
        碰撞数据
      </h2>

      <div className="space-y-3">
        <h3 className="text-xs text-zinc-500 font-medium uppercase tracking-wide">速度对比</h3>
        <div className="grid grid-cols-2 gap-2">
          <DataCard label="v₁ 碰撞前" value={v1.toFixed(2)} unit="m/s" color="cyan" />
          <DataCard label="v₁ 碰撞后" value={result.v1After.toFixed(2)} unit="m/s" color="cyan" highlight />
          <DataCard label="v₂ 碰撞前" value={v2.toFixed(2)} unit="m/s" color="orange" />
          <DataCard label="v₂ 碰撞后" value={result.v2After.toFixed(2)} unit="m/s" color="orange" highlight />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs text-zinc-500 font-medium uppercase tracking-wide">能量分析</h3>
        <div className="p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-zinc-400">动能损失</span>
            <span className="text-lg font-mono font-bold text-orange-400">
              {result.keLossPercent.toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-orange-500 to-red-500"
              style={{ width: `${Math.min(100, result.keLossPercent)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-zinc-500">
            <span>碰撞前 KE: {result.keBefore.toFixed(2)} J</span>
            <span>碰撞后 KE: {result.keAfter.toFixed(2)} J</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs text-zinc-500 font-medium uppercase tracking-wide">动量守恒验证</h3>
        <div className={`p-3 rounded-lg border ${isMomentumConserved ? 'bg-emerald-900/20 border-emerald-700/30' : 'bg-red-900/20 border-red-700/30'}`}>
          <div className="flex items-center gap-2 mb-2">
            {isMomentumConserved ? (
              <CheckCircle2 size={16} className="text-emerald-400" />
            ) : (
              <XCircle size={16} className="text-red-400" />
            )}
            <span className={`text-sm font-semibold ${isMomentumConserved ? 'text-emerald-300' : 'text-red-300'}`}>
              {isMomentumConserved ? '动量守恒' : '动量不守恒'}
            </span>
          </div>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-zinc-400">碰前总动量</span>
              <span className="text-cyan-300">{result.momentumBefore.toFixed(4)} kg·m/s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">碰后总动量</span>
              <span className="text-cyan-300">{result.momentumAfter.toFixed(4)} kg·m/s</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-zinc-700/30">
              <span className="text-zinc-400">差值 Δp</span>
              <span className={isMomentumConserved ? 'text-emerald-300' : 'text-red-300'}>
                {result.momentumDiff.toFixed(6)} kg·m/s
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/30 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">恢复系数 e</span>
          <span className="text-cyan-300 font-mono">{restitution.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">碰撞类型</span>
          <span className="text-zinc-300 font-mono">
            {restitution === 1 ? '完全弹性' : restitution === 0 ? '完全非弹性' : '非完全弹性'}
          </span>
        </div>
      </div>
    </div>
  );
}

function DataCard({
  label, value, unit, color, highlight,
}: {
  label: string;
  value: string;
  unit: string;
  color: 'cyan' | 'orange';
  highlight?: boolean;
}) {
  const textColor = color === 'cyan' ? (highlight ? 'text-cyan-200' : 'text-cyan-400') : (highlight ? 'text-orange-200' : 'text-orange-400');
  const bgColor = highlight
    ? color === 'cyan' ? 'bg-cyan-900/20 border-cyan-700/30' : 'bg-orange-900/20 border-orange-700/30'
    : 'bg-zinc-800/40 border-zinc-700/30';

  return (
    <div className={`p-2.5 rounded-lg border ${bgColor}`}>
      <div className="text-[10px] text-zinc-500 mb-1">{label}</div>
      <div className={`text-sm font-mono font-bold ${textColor}`}>
        {value} <span className="text-[10px] text-zinc-500 font-normal">{unit}</span>
      </div>
    </div>
  );
}
