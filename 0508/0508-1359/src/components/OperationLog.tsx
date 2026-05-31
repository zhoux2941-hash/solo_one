import { ScrollText } from 'lucide-react';
import useCacheStore, { type LogEntry } from '@/hooks/useCacheStore';

function getLogBadge(entry: LogEntry) {
  switch (entry.type) {
    case 'put':
      return (
        <span className="rounded bg-[#00ffc8]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#00ffc8]">
          PUT
        </span>
      );
    case 'get':
      return (
        <span className="rounded bg-[#a78bfa]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#a78bfa]">
          GET
        </span>
      );
    case 'evict':
      return (
        <span className="rounded bg-[#ff6b35]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#ff6b35]">
          EVICT
        </span>
      );
    case 'expire':
      return (
        <span className="rounded bg-[#ef4444]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#ef4444]">
          EXPIRE
        </span>
      );
    case 'reset':
      return (
        <span className="rounded bg-[#5a6a7a]/20 px-2 py-0.5 font-mono text-[10px] font-bold text-[#5a6a7a]">
          RESET
        </span>
      );
    case 'info':
      return (
        <span className="rounded bg-[#38bdf8]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#38bdf8]">
          INFO
        </span>
      );
  }
}

export default function OperationLog() {
  const { log } = useCacheStore();

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center gap-2">
        <ScrollText size={18} className="text-[#5a6a7a]" />
        <h2 className="font-display text-sm font-semibold tracking-wider text-[#5a6a7a] uppercase">
          操作日志
        </h2>
        <span className="ml-auto rounded-full bg-[#1e2a3a] px-3 py-1 font-mono text-xs text-[#3a4a5a]">
          {log.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto rounded-xl border border-[#1e2a3a] bg-[#080d16]/80">
        {log.length === 0 ? (
          <div className="flex h-full min-h-[200px] items-center justify-center p-4">
            <p className="font-mono text-xs text-[#2a3a4a]">暂无操作记录</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-[#1e2a3a]/50">
            {log.map((entry) => (
              <div
                key={`${entry.id}-${entry.timestamp}`}
                className="flex flex-col gap-1 px-3 py-2.5 transition-colors hover:bg-[#1e2a3a]/30"
              >
                <div className="flex items-center gap-2">
                  {getLogBadge(entry)}
                  <span className="font-mono text-[10px] text-[#3a4a5a]">
                    {new Date(entry.timestamp).toLocaleTimeString('zh-CN', {
                      hour12: false,
                    })}
                  </span>
                </div>
                <p className="font-mono text-xs text-[#8b9cb5] leading-relaxed">
                  {entry.result}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
