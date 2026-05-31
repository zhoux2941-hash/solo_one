import { Layers } from 'lucide-react';
import useCacheStore from '@/hooks/useCacheStore';
import CacheCard from '@/components/CacheCard';

export default function CacheVisualization() {
  const { cacheItems, capacity, now } = useCacheStore();

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center gap-2">
        <Layers size={18} className="text-[#00ffc8]" />
        <h2 className="font-display text-sm font-semibold tracking-wider text-[#00ffc8] uppercase">
          缓存状态
        </h2>
        <span className="ml-auto rounded-full bg-[#1e2a3a] px-3 py-1 font-mono text-xs text-[#5a6a7a]">
          {cacheItems.length} / {capacity}
        </span>
      </div>

      {cacheItems.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-[#1e2a3a] bg-[#0a0f1a]/50">
          <div className="text-center">
            <div className="mb-3 font-mono text-4xl text-[#1e2a3a]">∅</div>
            <p className="font-mono text-sm text-[#3a4a5a]">缓存为空</p>
            <p className="mt-1 font-mono text-xs text-[#2a3a4a]">
              使用 PUT 操作添加数据
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="h-1 w-4 rounded-full bg-[#00ffc8]" />
              <span className="font-mono text-[10px] font-semibold tracking-wider text-[#00ffc8] uppercase">
                ← 最近使用
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-semibold tracking-wider text-[#ff6b35] uppercase">
                最久未使用 →
              </span>
              <span className="h-1 w-4 rounded-full bg-[#ff6b35]" />
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {cacheItems.map((item, index) => (
              <CacheCard
                key={item.key}
                item={item}
                index={index}
                total={cacheItems.length}
                now={now}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-3 rounded-lg border border-[#1e2a3a] bg-[#0d1520]/50 px-4 py-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#1e2a3a]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#00ffc8] to-[#00b89c] transition-all duration-500"
            style={{
              width: `${(cacheItems.length / capacity) * 100}%`,
            }}
          />
        </div>
        <span className="font-mono text-xs text-[#5a6a7a]">
          {Math.round((cacheItems.length / capacity) * 100)}%
        </span>
      </div>
    </div>
  );
}
