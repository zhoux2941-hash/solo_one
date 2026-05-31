import { useEffect } from 'react';
import ControlPanel from '@/components/ControlPanel';
import CacheVisualization from '@/components/CacheVisualization';
import StatsPanel from '@/components/StatsPanel';
import OperationLog from '@/components/OperationLog';
import { Cpu } from 'lucide-react';
import useCacheStore from '@/hooks/useCacheStore';

export default function Home() {
  const tick = useCacheStore((s) => s.tick);

  useEffect(() => {
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-[#c8d6e5]">
      <header className="border-b border-[#1e2a3a] bg-[#0d1520]/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-6 py-4">
          <div className="flex items-center gap-2">
            <Cpu size={22} className="text-[#00ffc8]" />
            <h1 className="font-display text-lg font-bold tracking-tight text-[#e8f0fe]">
              LRU Cache
            </h1>
            <span className="rounded-full bg-[#00ffc8]/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-[#00ffc8]">
              O(1)
            </span>
          </div>
          <p className="ml-4 hidden font-mono text-xs text-[#3a4a5a] md:block">
            Least Recently Used 缓存淘汰算法模拟器
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr_280px]">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <ControlPanel />
          </aside>

          <section className="flex flex-col gap-6">
            <StatsPanel />
            <CacheVisualization />
          </section>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <OperationLog />
          </aside>
        </div>
      </main>
    </div>
  );
}
