import { useCircuitStore, PRESETS } from '@/store/circuitStore';
import Slider from './Slider';
import { Zap, CircleDot, Battery } from 'lucide-react';

export default function ControlPanel() {
  const { params, setResistance, setCapacitance, setVoltage } = useCircuitStore();

  return (
    <div className="space-y-6 animate-slide-in-left">
      <div className="glass-card p-5 glass-card-hover transition-all duration-300">
        <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400 mb-5 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-glow-pulse" />
          参数控制
        </h2>

        <div className="space-y-6">
          <Slider
            label="电阻 R"
            value={params.resistance}
            min={0.1}
            max={100}
            step={0.1}
            unit="kΩ"
            onChange={setResistance}
            color="#ff9f43"
            icon={<Zap size={14} className="text-charge" />}
          />

          <div className="h-px bg-gradient-to-r from-transparent via-navy-500 to-transparent" />

          <Slider
            label="电容 C"
            value={params.capacitance}
            min={0.1}
            max={1000}
            step={0.1}
            unit="μF"
            onChange={setCapacitance}
            color="#a855f7"
            icon={<CircleDot size={14} className="text-discharge" />}
          />

          <div className="h-px bg-gradient-to-r from-transparent via-navy-500 to-transparent" />

          <Slider
            label="电源电压 V₀"
            value={params.voltage}
            min={1}
            max={24}
            step={0.1}
            unit="V"
            onChange={setVoltage}
            color="#64ffda"
            icon={<Battery size={14} className="text-cyan-400" />}
          />
        </div>
      </div>

      <div className="glass-card p-5 glass-card-hover transition-all duration-300">
        <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400 mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-glow-pulse" />
          电路参数
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-navy-900/50">
            <span className="text-xs text-slate-400">时间常数 τ</span>
            <span className="font-bold text-cyan-400 glow-text font-display">
              {(params.resistance * params.capacitance * 1e-3).toFixed(4)} s
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-navy-900/50">
            <span className="text-xs text-slate-400">截止频率 f<sub>c</sub></span>
            <span className="font-bold text-cyan-400 glow-text font-display">
              {(1 / (2 * Math.PI * params.resistance * 1000 * params.capacitance * 1e-6)).toFixed(2)} Hz
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-navy-900/50">
            <span className="text-xs text-slate-400">完全充电时间 (5τ)</span>
            <span className="font-bold text-cyan-400 glow-text font-display">
              {(params.resistance * params.capacitance * 5e-3).toFixed(4)} s
            </span>
          </div>
        </div>
      </div>

      <div className="glass-card p-5 glass-card-hover transition-all duration-300">
        <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400 mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-glow-pulse" />
          公式
        </h2>
        <div className="space-y-2 text-xs">
          <div className="p-2.5 rounded-lg bg-navy-900/50 font-mono">
            <span className="text-slate-500">充电: </span>
            <span className="text-charge">V(t) = V₀(1 - e<sup>-t/τ</sup>)</span>
          </div>
          <div className="p-2.5 rounded-lg bg-navy-900/50 font-mono">
            <span className="text-slate-500">放电: </span>
            <span className="text-discharge">V(t) = V₀ · e<sup>-t/τ</sup></span>
          </div>
          <div className="p-2.5 rounded-lg bg-navy-900/50 font-mono">
            <span className="text-slate-500">常数: </span>
            <span className="text-cyan-400">τ = R × C</span>
          </div>
        </div>
      </div>
    </div>
  );
}
