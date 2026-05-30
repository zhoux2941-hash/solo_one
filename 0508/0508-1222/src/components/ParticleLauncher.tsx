import { useSimulationStore } from '@/store/useSimulationStore';
import { Rocket, Zap, Weight, Gauge } from 'lucide-react';

export function ParticleLauncher() {
  const {
    newParticleCharge,
    newParticleMass,
    newParticleSpeed,
    setNewParticleCharge,
    setNewParticleMass,
    setNewParticleSpeed,
    currentTool,
  } = useSimulationStore();

  return (
    <div className="bg-slate-800/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Rocket size={20} className="text-orange-400" />
        <h3 className="text-white font-semibold">粒子发射器</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-slate-400 text-sm mb-2 flex items-center gap-1">
            <Zap size={14} /> 粒子电荷量 (e)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="-5"
              max="5"
              step="0.1"
              value={newParticleCharge}
              onChange={(e) => setNewParticleCharge(parseFloat(e.target.value))}
              className="flex-1 accent-orange-500"
            />
            <span
              className={`font-mono text-sm w-16 text-right ${
                newParticleCharge >= 0 ? 'text-cyan-400' : 'text-red-400'
              }`}
            >
              {newParticleCharge > 0 ? '+' : ''}
              {newParticleCharge.toFixed(1)}
            </span>
          </div>
        </div>

        <div>
          <label className="text-slate-400 text-sm mb-2 flex items-center gap-1">
            <Weight size={14} /> 粒子质量 (×10⁻⁹ kg)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={newParticleMass}
              onChange={(e) => setNewParticleMass(parseFloat(e.target.value))}
              className="flex-1 accent-orange-500"
            />
            <span className="text-orange-400 font-mono text-sm w-16 text-right">
              {newParticleMass.toFixed(1)}
            </span>
          </div>
        </div>

        <div>
          <label className="text-slate-400 text-sm mb-2 flex items-center gap-1">
            <Gauge size={14} /> 初始速度 (px/s)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="10"
              max="200"
              step="5"
              value={newParticleSpeed}
              onChange={(e) => setNewParticleSpeed(parseFloat(e.target.value))}
              className="flex-1 accent-orange-500"
            />
            <span className="text-orange-400 font-mono text-sm w-16 text-right">
              {newParticleSpeed}
            </span>
          </div>
        </div>

        <div
          className={`rounded-lg p-3 border-2 border-dashed ${
            currentTool === 'particle'
              ? 'border-orange-500 bg-orange-500/10'
              : 'border-slate-600 bg-slate-900/50'
          }`}
        >
          <p className="text-xs text-slate-400">
            {currentTool === 'particle' ? (
              <>
                <span className="text-orange-400">已选择发射模式</span>
                <br />
                点击并拖拽画布设定发射方向
              </>
            ) : (
              '在顶部工具栏选择粒子发射工具'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
