import useGameStore from "@/hooks/useGameStore";

export default function StatusBar() {
  const generation = useGameStore((s) => s.generation);
  const aliveCells = useGameStore((s) => s.aliveCells);

  return (
    <div className="flex items-center gap-6 px-4 py-2 bg-[#0d1117]/80 rounded-lg border border-[#1a2332]">
      <div className="flex items-center gap-2">
        <span className="text-[#8b949e] text-xs font-mono uppercase tracking-wider">代数</span>
        <span className="text-[#00ff88] font-mono text-lg font-bold tabular-nums min-w-[3ch] text-right">
          {generation}
        </span>
      </div>
      <div className="w-px h-5 bg-[#1a2332]" />
      <div className="flex items-center gap-2">
        <span className="text-[#8b949e] text-xs font-mono uppercase tracking-wider">活细胞</span>
        <span className="text-[#4ecca3] font-mono text-lg font-bold tabular-nums min-w-[4ch] text-right">
          {aliveCells}
        </span>
      </div>
    </div>
  );
}
