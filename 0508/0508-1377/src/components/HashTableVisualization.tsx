import { useHashTableStore, SlotStatus } from "@/store/useHashTableStore";
import SlotCard from "./SlotCard";

export default function HashTableVisualization() {
  const { table, probePath, lastHighlightedIndex, size } = useHashTableStore();

  const probePathSet = new Set(probePath.map((p) => p.index));
  const probeFinalIndex = probePath.find((p) => p.isFinal)?.index ?? null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
          哈希表数组
        </h2>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-zinc-800/50 border border-zinc-700/50" />
            <span className="text-zinc-500">空</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-cyan-950/30 border border-cyan-600/40" />
            <span className="text-zinc-500">占用</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-cyan-950/60 border border-cyan-500/70 shadow-[0_0_4px_rgba(6,182,212,0.3)]" />
            <span className="text-zinc-500">聚类</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-amber-950/40 border border-amber-500/50" />
            <span className="text-zinc-500">已删除</span>
          </div>
        </div>
      </div>

      <div
        className={`grid gap-2 ${
          size <= 10
            ? "grid-cols-5"
            : size <= 20
              ? "grid-cols-5 md:grid-cols-10"
              : "grid-cols-5 md:grid-cols-10 lg:grid-cols-13"
        }`}
      >
        {table.map((slot, index) => (
          <SlotCard
            key={index}
            slot={slot}
            index={index}
            isInProbePath={probePathSet.has(index)}
            isProbeFinal={probeFinalIndex === index}
            isLastHighlighted={lastHighlightedIndex === index && !probePathSet.has(index)}
          />
        ))}
      </div>

      {probePath.length > 0 && (
        <div className="px-4 py-2.5 rounded-lg bg-violet-950/30 border border-violet-500/30 text-xs">
          <div className="text-violet-400 font-semibold mb-1">探测路径</div>
          <div className="text-zinc-400 font-mono">
            {probePath.map((step, i) => (
              <span key={i}>
                <span className={step.isFinal ? "text-emerald-400 font-bold" : "text-violet-300"}>
                  [{step.index}]
                </span>
                {i < probePath.length - 1 && (
                  <span className="text-zinc-600 mx-1">→</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
