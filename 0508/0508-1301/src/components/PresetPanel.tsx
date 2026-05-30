import { Grid3x3, Grid2x2, Globe, Square } from "lucide-react";
import useGameStore from "@/hooks/useGameStore";
import { PRESETS } from "@/utils/presets";
import type { Preset } from "@/utils/presets";
import type { BoundaryMode } from "@/utils/gameEngine";

export default function PresetPanel() {
  const loadPreset = useGameStore((s) => s.loadPreset);
  const isRunning = useGameStore((s) => s.isRunning);

  return (
    <div className="space-y-2">
      <label className="text-[#8b949e] text-xs font-mono uppercase tracking-wider">预设图案</label>
      <div className="grid grid-cols-3 gap-1.5">
        {PRESETS.map((preset: Preset) => (
          <button
            key={preset.name}
            onClick={() => loadPreset(preset)}
            disabled={isRunning}
            className="px-2 py-1.5 rounded-md font-mono text-[11px] text-[#c9d1d9] border border-[#1a2332] hover:bg-[#1a2332]/80 hover:border-[#4ecca3]/30 hover:text-[#4ecca3] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {preset.nameCN}
          </button>
        ))}
      </div>
    </div>
  );
}

export function GridLinesToggle() {
  const showGridLines = useGameStore((s) => s.showGridLines);
  const toggleGridLines = useGameStore((s) => s.toggleGridLines);

  return (
    <div className="flex items-center justify-between">
      <label className="text-[#8b949e] text-xs font-mono uppercase tracking-wider">网格线</label>
      <button
        onClick={toggleGridLines}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-xs transition-all duration-200 ${
          showGridLines
            ? "text-[#00ff88] bg-[#00ff88]/10 border border-[#00ff88]/30"
            : "text-[#484f58] bg-[#0d1117] border border-[#1a2332] hover:text-[#8b949e]"
        }`}
      >
        {showGridLines ? <Grid3x3 size={12} /> : <Grid2x2 size={12} />}
        {showGridLines ? "显示" : "隐藏"}
      </button>
    </div>
  );
}

export function BoundaryModeToggle() {
  const boundaryMode = useGameStore((s) => s.boundaryMode);
  const setBoundaryMode = useGameStore((s) => s.setBoundaryMode);

  return (
    <div className="flex items-center justify-between">
      <label className="text-[#8b949e] text-xs font-mono uppercase tracking-wider">边界模式</label>
      <div className="flex gap-1">
        <button
          onClick={() => setBoundaryMode("toroidal" as BoundaryMode)}
          className={`flex items-center gap-1 px-2 py-1 rounded-md font-mono text-xs transition-all duration-200 ${
            boundaryMode === "toroidal"
              ? "text-[#00ff88] bg-[#00ff88]/10 border border-[#00ff88]/30"
              : "text-[#484f58] bg-[#0d1117] border border-[#1a2332] hover:text-[#8b949e]"
          }`}
        >
          <Globe size={11} />
          环形
        </button>
        <button
          onClick={() => setBoundaryMode("fixed" as BoundaryMode)}
          className={`flex items-center gap-1 px-2 py-1 rounded-md font-mono text-xs transition-all duration-200 ${
            boundaryMode === "fixed"
              ? "text-[#4ecca3] bg-[#4ecca3]/10 border border-[#4ecca3]/30"
              : "text-[#484f58] bg-[#0d1117] border border-[#1a2332] hover:text-[#8b949e]"
          }`}
        >
          <Square size={11} />
          固定
        </button>
      </div>
    </div>
  );
}
