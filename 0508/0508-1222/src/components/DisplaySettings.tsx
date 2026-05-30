import { useSimulationStore } from '@/store/useSimulationStore';
import { Settings, Grid3X3, Layers, Crosshair, Zap, Eye, EyeOff } from 'lucide-react';

export function DisplaySettings() {
  const {
    displayConfig,
    simulationState,
    setVectorGridDensity,
    setFieldLineDensity,
    setDt,
    toggleShowVectorField,
    toggleShowFieldLines,
    toggleShowTrajectories,
    toggleShowGrid,
  } = useSimulationStore();

  return (
    <div className="bg-slate-800/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Settings size={20} className="text-slate-400" />
        <h3 className="text-white font-semibold">显示设置</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-slate-400 text-sm mb-2 flex items-center gap-1">
            <Zap size={14} /> 矢量场网格密度
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={displayConfig.vectorGridDensity}
              onChange={(e) => setVectorGridDensity(parseInt(e.target.value))}
              className="flex-1 accent-cyan-500"
            />
            <span className="text-cyan-400 font-mono text-sm w-12 text-right">
              {displayConfig.vectorGridDensity}
            </span>
          </div>
        </div>

        <div>
          <label className="text-slate-400 text-sm mb-2 flex items-center gap-1">
            <Layers size={14} /> 电场线密度
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={displayConfig.fieldLineDensity}
              onChange={(e) => setFieldLineDensity(parseInt(e.target.value))}
              className="flex-1 accent-cyan-500"
            />
            <span className="text-cyan-400 font-mono text-sm w-12 text-right">
              {displayConfig.fieldLineDensity}
            </span>
          </div>
        </div>

        <div>
          <label className="text-slate-400 text-sm mb-2 flex items-center gap-1">
            <Crosshair size={14} /> 模拟时间步长 (dt)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0.001"
              max="0.05"
              step="0.001"
              value={simulationState.dt}
              onChange={(e) => setDt(parseFloat(e.target.value))}
              className="flex-1 accent-emerald-500"
            />
            <span className="text-emerald-400 font-mono text-sm w-16 text-right">
              {simulationState.dt.toFixed(3)}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-700">
          <p className="text-slate-400 text-sm mb-3">显示开关</p>
          <div className="space-y-2">
            <ToggleButton
              label="电场矢量场"
              enabled={displayConfig.showVectorField}
              onClick={toggleShowVectorField}
            />
            <ToggleButton
              label="静电场线"
              enabled={displayConfig.showFieldLines}
              onClick={toggleShowFieldLines}
            />
            <ToggleButton
              label="粒子轨迹"
              enabled={displayConfig.showTrajectories}
              onClick={toggleShowTrajectories}
            />
            <ToggleButton
              label="背景网格"
              enabled={displayConfig.showGrid}
              onClick={toggleShowGrid}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface ToggleButtonProps {
  label: string;
  enabled: boolean;
  onClick: () => void;
}

function ToggleButton({ label, enabled, onClick }: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-3 py-2 rounded-lg flex items-center justify-between text-sm transition-all ${
        enabled
          ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
          : 'bg-slate-700/50 text-slate-400 border border-transparent'
      }`}
    >
      <span>{label}</span>
      {enabled ? <Eye size={16} /> : <EyeOff size={16} />}
    </button>
  );
}
