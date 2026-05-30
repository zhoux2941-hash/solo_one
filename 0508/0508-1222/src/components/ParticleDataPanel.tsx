import { useSimulationStore } from '@/store/useSimulationStore';
import { calculateKineticEnergy, calculateSpeed } from '@/utils/physics/rk4Integrator';
import { Activity, Gauge, Zap, Target } from 'lucide-react';

export function ParticleDataPanel() {
  const { particles, selectedParticleId } = useSimulationStore();
  const selectedParticle = particles.find((p) => p.id === selectedParticleId);

  return (
    <div className="bg-slate-800/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={20} className="text-emerald-400" />
        <h3 className="text-white font-semibold">粒子数据</h3>
        <span className="ml-auto text-slate-500 text-sm">共 {particles.length} 个粒子</span>
      </div>

      {selectedParticle ? (
        <div className="space-y-4 font-mono text-sm">
          <DataRow icon={<Target size={14} />} label="位置">
            <span className="text-cyan-400">({selectedParticle.x.toFixed(1)}, {selectedParticle.y.toFixed(1)})</span>
          </DataRow>

          <DataRow icon={<Gauge size={14} />} label="速度 Vx">
            <span className="text-emerald-400">{(selectedParticle.vx / 100).toFixed(2)} m/s</span>
          </DataRow>

          <DataRow icon={<Gauge size={14} />} label="速度 Vy">
            <span className="text-emerald-400">{(selectedParticle.vy / 100).toFixed(2)} m/s</span>
          </DataRow>

          <DataRow icon={<Gauge size={14} />} label="速率 |V|">
            <span className="text-yellow-400">{(calculateSpeed(selectedParticle) / 100).toFixed(2)} m/s</span>
          </DataRow>

          <DataRow icon={<Zap size={14} />} label="动能">
            <span className="text-orange-400">
              {(calculateKineticEnergy(selectedParticle) * 1e6).toFixed(2)} µJ
            </span>
          </DataRow>

          <div className="pt-3 border-t border-slate-700">
            <p className="text-xs text-slate-500 mb-2">粒子属性</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-900/50 rounded-lg p-2">
                <span className="text-slate-500 text-xs">电荷量</span>
                <p
                  className={`font-mono ${
                    selectedParticle.charge >= 0 ? 'text-cyan-400' : 'text-red-400'
                  }`}
                >
                  {selectedParticle.charge > 0 ? '+' : ''}
                  {(selectedParticle.charge * 1e6).toFixed(2)} µC
                </p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-2">
                <span className="text-slate-500 text-xs">质量</span>
                <p className="font-mono text-purple-400">
                  {(selectedParticle.mass * 1e9).toFixed(2)} ng
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-slate-500 text-sm">点击画布上的粒子查看数据</p>
        </div>
      )}
    </div>
  );
}

interface DataRowProps {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}

function DataRow({ icon, label, children }: DataRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}
