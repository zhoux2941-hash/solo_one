import { Shuffle, Zap, ZapOff } from "lucide-react";
import useGameStore from "@/hooks/useGameStore";
import { useMemo } from "react";

export function SpeedSlider() {
  const speed = useGameStore((s) => s.speed);
  const adaptiveSpeed = useGameStore((s) => s.adaptiveSpeed);
  const aliveCells = useGameStore((s) => s.aliveCells);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const toggleAdaptiveSpeed = useGameStore((s) => s.toggleAdaptiveSpeed);
  const getEffectiveSpeed = useGameStore((s) => s.getEffectiveSpeed);

  const effectiveSpeed = useMemo(() => getEffectiveSpeed(), [getEffectiveSpeed, aliveCells]);
  const displaySpeed = Math.round(1000 / effectiveSpeed);
  const baseDisplay = Math.round(1000 / speed);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <label className="text-[#8b949e] text-xs font-mono uppercase tracking-wider">演化速度</label>
          <button
            onClick={toggleAdaptiveSpeed}
            className={`p-0.5 rounded transition-all duration-200 ${
              adaptiveSpeed
                ? "text-[#00ff88] bg-[#00ff88]/10 hover:bg-[#00ff88]/20"
                : "text-[#484f58] hover:text-[#8b949e]"
            }`}
            title={adaptiveSpeed ? "自适应速度已开启：活跃时自动加速" : "自适应速度已关闭"}
          >
            {adaptiveSpeed ? <Zap size={12} fill="currentColor" /> : <ZapOff size={12} />}
          </button>
        </div>
        <span className="text-xs font-mono">
          <span className="text-[#4ecca3]">{displaySpeed}</span>
          {adaptiveSpeed && (
            <span className="text-[#484f58] ml-1">({baseDisplay}) 步/秒</span>
          )}
          {!adaptiveSpeed && (
            <span className="text-[#484f58] ml-1">步/秒</span>
          )}
        </span>
      </div>
      <input
        type="range"
        min={50}
        max={500}
        step={10}
        value={speed}
        onChange={(e) => setSpeed(Number(e.target.value))}
        className="w-full accent-[#00ff88] h-1.5 bg-[#1a2332] rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
          [&::-webkit-slider-thumb]:bg-[#00ff88] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(0,255,136,0.4)]
          [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-shadow
          [&::-webkit-slider-thumb]:hover:shadow-[0_0_12px_rgba(0,255,136,0.6)]"
      />
      <div className="flex justify-between text-[10px] text-[#484f58] font-mono">
        <span>快</span>
        <span>慢</span>
      </div>
    </div>
  );
}

export function GridSizeSlider() {
  const rows = useGameStore((s) => s.rows);
  const setGridSize = useGameStore((s) => s.setGridSize);
  const isRunning = useGameStore((s) => s.isRunning);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <label className="text-[#8b949e] text-xs font-mono uppercase tracking-wider">网格尺寸</label>
        <span className="text-[#4ecca3] text-xs font-mono">{rows}×{rows}</span>
      </div>
      <input
        type="range"
        min={20}
        max={100}
        step={5}
        value={rows}
        onChange={(e) => setGridSize(Number(e.target.value), Number(e.target.value))}
        disabled={isRunning}
        className="w-full accent-[#00ff88] h-1.5 bg-[#1a2332] rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
          [&::-webkit-slider-thumb]:bg-[#00ff88] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(0,255,136,0.4)]
          [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-shadow
          [&::-webkit-slider-thumb]:hover:shadow-[0_0_12px_rgba(0,255,136,0.6)]
          disabled:opacity-30 disabled:cursor-not-allowed"
      />
      <div className="flex justify-between text-[10px] text-[#484f58] font-mono">
        <span>20×20</span>
        <span>100×100</span>
      </div>
    </div>
  );
}

export function RandomizeControl() {
  const survivalProbability = useGameStore((s) => s.survivalProbability);
  const setSurvivalProbability = useGameStore((s) => s.setSurvivalProbability);
  const randomize = useGameStore((s) => s.randomize);
  const isRunning = useGameStore((s) => s.isRunning);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <label className="text-[#8b949e] text-xs font-mono uppercase tracking-wider">存活概率</label>
        <span className="text-[#4ecca3] text-xs font-mono">{Math.round(survivalProbability * 100)}%</span>
      </div>
      <input
        type="range"
        min={0.05}
        max={0.8}
        step={0.05}
        value={survivalProbability}
        onChange={(e) => setSurvivalProbability(Number(e.target.value))}
        disabled={isRunning}
        className="w-full accent-[#4ecca3] h-1.5 bg-[#1a2332] rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
          [&::-webkit-slider-thumb]:bg-[#4ecca3] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(78,204,163,0.4)]
          [&::-webkit-slider-thumb]:cursor-pointer
          disabled:opacity-30 disabled:cursor-not-allowed"
      />
      <button
        onClick={() => randomize(survivalProbability)}
        disabled={isRunning}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs text-[#4ecca3] border border-[#4ecca3]/30 hover:bg-[#4ecca3]/15 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Shuffle size={12} />
        随机初始化
      </button>
    </div>
  );
}
