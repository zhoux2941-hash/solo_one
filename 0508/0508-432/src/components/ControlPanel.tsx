import { useSimulationStore } from '@/store/simulationStore';
import { MATERIAL_PRESETS, MaterialType } from '@/utils/physics';
import { Play, RotateCcw, Zap } from 'lucide-react';

const MATERIALS: MaterialType[] = ['rubber', 'steel', 'glass', 'custom'];

export default function ControlPanel() {
  const store = useSimulationStore();
  const {
    material1, material2, restitution, v1, v2, m1, m2, isRunning,
    setMaterial1, setMaterial2, setRestitution, setV1, setV2, setM1, setM2,
    start, reset,
  } = store;

  return (
    <div className="flex flex-col gap-5 p-5 bg-[#0d1225]/80 backdrop-blur-sm rounded-xl border border-cyan-900/20">
      <div className="flex items-center gap-2 mb-1">
        <Zap size={16} className="text-cyan-400" />
        <h2 className="text-sm font-semibold tracking-wider text-cyan-300 uppercase">参数设置</h2>
      </div>

      <div className="space-y-3">
        <label className="text-xs text-zinc-400 font-medium">球1 材质</label>
        <div className="grid grid-cols-4 gap-2">
          {MATERIALS.map((mat) => (
            <button
              key={mat}
              onClick={() => setMaterial1(mat)}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border
                ${material1 === mat
                  ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-[0_0_12px_rgba(0,229,255,0.15)]'
                  : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                }`}
            >
              {MATERIAL_PRESETS[mat].icon} {MATERIAL_PRESETS[mat].label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-xs text-zinc-400 font-medium">球2 材质</label>
        <div className="grid grid-cols-4 gap-2">
          {MATERIALS.map((mat) => (
            <button
              key={mat}
              onClick={() => setMaterial2(mat)}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border
                ${material2 === mat
                  ? 'bg-orange-500/20 border-orange-400/50 text-orange-300 shadow-[0_0_12px_rgba(255,107,53,0.15)]'
                  : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                }`}
            >
              {MATERIAL_PRESETS[mat].icon} {MATERIAL_PRESETS[mat].label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-zinc-400 font-medium">恢复系数 e</label>
          <span className="text-sm font-mono text-cyan-300">{restitution.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={restitution}
          onChange={(e) => setRestitution(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-cyan-400
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(0,229,255,0.5)]"
        />
        <div className="flex justify-between text-[10px] text-zinc-600">
          <span>0 (完全非弹性)</span>
          <span>1 (完全弹性)</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ParamInput label="v₁ 初速度 (m/s)" value={v1} onChange={setV1} color="cyan" step={0.5} min={-20} max={20} />
        <ParamInput label="v₂ 初速度 (m/s)" value={v2} onChange={setV2} color="orange" step={0.5} min={-20} max={20} />
        <ParamInput label="m₁ 质量 (kg)" value={m1} onChange={setM1} color="cyan" step={0.5} min={0.1} max={20} />
        <ParamInput label="m₂ 质量 (kg)" value={m2} onChange={setM2} color="orange" step={0.5} min={0.1} max={20} />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={start}
          disabled={isRunning}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm
            bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-[0_0_20px_rgba(0,229,255,0.3)]
            hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] hover:from-cyan-400 hover:to-cyan-500
            transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Play size={16} /> 开始碰撞
        </button>
        <button
          onClick={reset}
          className="px-4 py-2.5 rounded-xl text-sm font-medium border border-zinc-600 text-zinc-300
            hover:border-zinc-400 hover:text-white transition-all duration-200"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}

function ParamInput({
  label, value, onChange, color, step, min, max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: 'cyan' | 'orange';
  step: number;
  min: number;
  max: number;
}) {
  const borderColor = color === 'cyan' ? 'border-cyan-800/40 focus-within:border-cyan-500/60' : 'border-orange-800/40 focus-within:border-orange-500/60';
  const textColor = color === 'cyan' ? 'text-cyan-300' : 'text-orange-300';

  return (
    <div className={`space-y-1`}>
      <label className="text-[10px] text-zinc-500 font-medium">{label}</label>
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/60 border ${borderColor} transition-colors`}>
        <input
          type="number"
          value={value}
          step={step}
          min={min}
          max={max}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={`w-full bg-transparent text-sm font-mono ${textColor} outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
        />
      </div>
    </div>
  );
}
