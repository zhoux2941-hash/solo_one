import { useHashTableStore } from "@/store/useHashTableStore";
import { Activity, BarChart3, Layers, TrendingUp, AlertTriangle } from "lucide-react";

export default function StatsPanel() {
  const { size, rehashThreshold, getUsedCount, getDeletedCount, getLoadFactor, getClusterCount, getMaxClusterSize, getAverageProbeLength } =
    useHashTableStore();

  const usedCount = getUsedCount();
  const deletedCount = getDeletedCount();
  const loadFactor = getLoadFactor();
  const clusterCount = getClusterCount();
  const maxClusterSize = getMaxClusterSize();
  const avgProbe = getAverageProbeLength();
  const emptyCount = size - usedCount - deletedCount;

  const loadPercent = Math.round(loadFactor * 100);
  const thresholdPercent = Math.round(rehashThreshold * 100);
  const isNearThreshold = loadFactor > rehashThreshold * 0.85 && loadFactor <= rehashThreshold;
  const isOverThreshold = loadFactor > rehashThreshold;

  const barColor = isOverThreshold
    ? "bg-red-500"
    : isNearThreshold
      ? "bg-amber-500"
      : loadPercent > 40
        ? "bg-cyan-500"
        : "bg-emerald-500";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Activity size={14} />
          负载因子
        </h3>
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold font-mono text-zinc-200">
              {loadPercent}%
            </span>
            <div className="flex items-center gap-2">
              {isOverThreshold && (
                <span className="text-[10px] text-red-400 flex items-center gap-1">
                  <AlertTriangle size={10} />
                  超出阈值
                </span>
              )}
              <span className="text-xs text-zinc-500 font-mono">
                ({usedCount + deletedCount}/{size})
              </span>
            </div>
          </div>
          <div className="relative w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${barColor} rounded-full transition-all duration-500 ease-out`}
              style={{ width: `${Math.min(loadPercent, 100)}%` }}
            />
            <div
              className="absolute top-0 h-full w-0.5 bg-rose-400 z-10"
              style={{ left: `${thresholdPercent}%` }}
            >
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[9px] text-rose-400 font-mono whitespace-nowrap">
                {thresholdPercent}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="px-3 py-2.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50 text-center">
          <div className="text-lg font-bold font-mono text-cyan-400">{usedCount}</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">已占用</div>
        </div>
        <div className="px-3 py-2.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50 text-center">
          <div className="text-lg font-bold font-mono text-amber-400">{deletedCount}</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">已删除</div>
        </div>
        <div className="px-3 py-2.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50 text-center">
          <div className="text-lg font-bold font-mono text-zinc-400">{emptyCount}</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">空闲</div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Layers size={14} />
          聚类分析
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="px-3 py-2.5 rounded-lg bg-zinc-800/60 border border-cyan-800/30 text-center">
            <div className="text-lg font-bold font-mono text-cyan-400">{clusterCount}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">聚类数量</div>
          </div>
          <div className="px-3 py-2.5 rounded-lg bg-zinc-800/60 border border-cyan-800/30 text-center">
            <div className="text-lg font-bold font-mono text-cyan-400">{maxClusterSize}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">最大聚类</div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <BarChart3 size={14} />
          探测效率
        </h3>
        <div className="px-3 py-2.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50">
          <div className="flex justify-between items-center">
            <span className="text-xs text-zinc-500">平均探测长度</span>
            <span className="text-base font-bold font-mono text-emerald-400">
              {avgProbe.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp size={14} />
          负载因子影响
        </h3>
        <div className="px-3 py-2 rounded-lg bg-zinc-800/40 border border-zinc-700/30">
          <div className="text-[11px] text-zinc-500 leading-relaxed">
            {loadPercent < 30 && "低负载：冲突极少，探测长度接近1"}
            {loadPercent >= 30 && loadPercent < 60 && "中等负载：开始出现聚类，探测长度增加"}
            {loadPercent >= 60 && !isOverThreshold && "高负载：聚类现象明显，性能下降"}
            {isOverThreshold && "极高负载：已触发自动Rehash扩容"}
          </div>
        </div>
      </div>
    </div>
  );
}
