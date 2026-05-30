import { Play, Pause, SkipForward, RotateCcw, Trash2 } from "lucide-react";
import useGameStore from "@/hooks/useGameStore";

export default function ControlPanel() {
  const isRunning = useGameStore((s) => s.isRunning);
  const start = useGameStore((s) => s.start);
  const pause = useGameStore((s) => s.pause);
  const step = useGameStore((s) => s.step);
  const reset = useGameStore((s) => s.reset);
  const clear = useGameStore((s) => s.clear);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={isRunning ? pause : start}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-mono text-sm font-medium transition-all duration-200 ${
          isRunning
            ? "bg-[#ff6b6b]/20 text-[#ff6b6b] border border-[#ff6b6b]/30 hover:bg-[#ff6b6b]/30"
            : "bg-[#00ff88]/15 text-[#00ff88] border border-[#00ff88]/30 hover:bg-[#00ff88]/25 hover:shadow-[0_0_15px_rgba(0,255,136,0.15)]"
        }`}
      >
        {isRunning ? <Pause size={14} /> : <Play size={14} />}
        {isRunning ? "暂停" : "开始"}
      </button>
      <button
        onClick={step}
        disabled={isRunning}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-mono text-sm text-[#8b949e] border border-[#1a2332] hover:bg-[#1a2332]/50 hover:text-[#c9d1d9] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <SkipForward size={14} />
        单步
      </button>
      <button
        onClick={reset}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-mono text-sm text-[#8b949e] border border-[#1a2332] hover:bg-[#1a2332]/50 hover:text-[#c9d1d9] transition-all duration-200"
      >
        <RotateCcw size={14} />
        重置
      </button>
      <button
        onClick={clear}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-mono text-sm text-[#8b949e] border border-[#1a2332] hover:bg-[#ff6b6b]/10 hover:text-[#ff6b6b] hover:border-[#ff6b6b]/30 transition-all duration-200"
      >
        <Trash2 size={14} />
        清空
      </button>
    </div>
  );
}
