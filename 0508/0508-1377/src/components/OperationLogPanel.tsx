import { useHashTableStore, OperationLog } from "@/store/useHashTableStore";
import { ScrollText } from "lucide-react";
import { useEffect, useRef } from "react";

function getLogColor(type: OperationLog["type"]) {
  switch (type) {
    case "insert":
      return "text-cyan-400";
    case "delete":
      return "text-amber-400";
    case "batch":
      return "text-violet-400";
    case "reset":
      return "text-zinc-400";
    case "rehash":
      return "text-rose-400";
  }
}

function getLogBg(type: OperationLog["type"]) {
  switch (type) {
    case "insert":
      return "border-l-cyan-500";
    case "delete":
      return "border-l-amber-500";
    case "batch":
      return "border-l-violet-500";
    case "reset":
      return "border-l-zinc-500";
    case "rehash":
      return "border-l-rose-500";
  }
}

function getLogLabel(type: OperationLog["type"]) {
  switch (type) {
    case "insert":
      return "插入";
    case "delete":
      return "删除";
    case "batch":
      return "批量";
    case "reset":
      return "重置";
    case "rehash":
      return "Rehash";
  }
}

export default function OperationLogPanel() {
  const logs = useHashTableStore((s) => s.logs);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2 mb-3 shrink-0">
        <ScrollText size={14} />
        操作日志
      </h3>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-1.5 max-h-[300px] pr-1 scrollbar-thin"
      >
        {logs.length === 0 && (
          <div className="text-xs text-zinc-600 text-center py-4">
            暂无操作记录
          </div>
        )}
        {logs.map((log) => (
          <div
            key={log.id}
            className={`px-3 py-2 rounded-md bg-zinc-800/40 border-l-2 ${getLogBg(log.type)} text-xs`}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className={`font-semibold ${getLogColor(log.type)}`}>
                {getLogLabel(log.type)}
              </span>
              {log.probeCount > 0 && (
                <span className="text-zinc-600 font-mono">
                  探测 {log.probeCount} 步
                </span>
              )}
            </div>
            <div className="text-zinc-400 font-mono text-[11px] leading-relaxed">
              {log.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
