import ControlPanel from "@/components/ControlPanel";
import HashTableVisualization from "@/components/HashTableVisualization";
import StatsPanel from "@/components/StatsPanel";
import OperationLogPanel from "@/components/OperationLogPanel";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm font-mono">#</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                哈希表线性探测可视化
              </h1>
              <p className="text-xs text-zinc-500">
                负载因子 · 聚类现象 · 冲突解决策略
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-xs text-zinc-600">
            <span className="font-mono">Linear Probing</span>
            <span className="text-zinc-800">|</span>
            <span className="font-mono">Open Addressing</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_260px] gap-6">
          <aside className="space-y-6">
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
              <ControlPanel />
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
              <StatsPanel />
            </div>
          </aside>

          <section className="space-y-6">
            <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
              <HashTableVisualization />
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/60 lg:hidden">
              <StatsPanel />
            </div>
          </section>

          <aside className="space-y-6">
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/80 min-h-[400px] flex flex-col">
              <OperationLogPanel />
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                图例说明
              </h3>
              <div className="space-y-2 text-xs text-zinc-500">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-violet-400/70 bg-violet-950/50 shadow-[0_0_6px_rgba(139,92,246,0.3)]" />
                  <span>探测路径中的槽位</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-emerald-400 bg-emerald-950/60 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                  <span>最终插入位置</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-cyan-500/70 bg-cyan-950/60 shadow-[0_0_6px_rgba(6,182,212,0.3)]" />
                  <span>聚类区域（≥2连续占用）</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-amber-500/50 bg-amber-950/40" />
                  <span>已删除（墓碑标记）</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-rose-500/50 bg-rose-950/40" />
                  <span>Rehash 重新哈希</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
