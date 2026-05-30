import { useAppStore } from '@/store/appStore';
import { GlassPanel } from '@/components/UI/GlassPanel';
import { Satellite } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const SATELLITE_COLORS: Record<string, string> = {
  iss: 'from-cyan-400 to-blue-500',
  hubble: 'from-purple-400 to-pink-500',
  beidou: 'from-red-400 to-orange-500',
  tiangong: 'from-emerald-400 to-teal-500',
  gps: 'from-blue-400 to-indigo-500',
  glonass: 'from-amber-400 to-yellow-500',
  starlink: 'from-slate-400 to-gray-500',
  noaa19: 'from-teal-400 to-cyan-500',
  landsat9: 'from-green-400 to-emerald-500',
  jwst: 'from-violet-400 to-purple-500',
};

export function SatelliteSelector() {
  const satellites = useAppStore((s) => s.satellites);
  const selectedSatellite = useAppStore((s) => s.selectedSatellite);
  const setSelectedSatellite = useAppStore((s) => s.setSelectedSatellite);
  const showAllOrbits = useAppStore((s) => s.showAllOrbits);
  const setShowAllOrbits = useAppStore((s) => s.setShowAllOrbits);

  return (
    <GlassPanel className="w-72 absolute left-6 top-6 bottom-6 overflow-hidden flex flex-col" glow="cyan">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-bold text-cyan-300 flex items-center gap-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          <Satellite size={20} />
          卫星选择
        </h2>
        <p className="text-xs text-white/50 mt-1">选择卫星查看轨道</p>
      </div>

      <div className="flex gap-2 p-3 border-b border-white/10">
        <button
          onClick={() => setShowAllOrbits(true)}
          className={twMerge(
            'flex-1 py-1.5 rounded-lg text-xs font-medium transition-all',
            showAllOrbits
              ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50'
              : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
          )}
        >
          全部轨道
        </button>
        <button
          onClick={() => setShowAllOrbits(false)}
          className={twMerge(
            'flex-1 py-1.5 rounded-lg text-xs font-medium transition-all',
            !showAllOrbits
              ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50'
              : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
          )}
        >
          仅当前
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {satellites.map((sat) => {
          const isSelected = selectedSatellite?.id === sat.id;
          const colorClass = SATELLITE_COLORS[sat.id] || 'from-cyan-400 to-blue-500';
          return (
            <button
              key={sat.id}
              onClick={() => setSelectedSatellite(sat)}
              className={twMerge(
                'w-full text-left rounded-xl p-3 transition-all duration-300 border',
                isSelected
                  ? `bg-gradient-to-r ${colorClass}/20 border-cyan-400/50 shadow-[0_0_15px_rgba(0,212,255,0.2)]`
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className={twMerge(
                    'w-2 h-2 rounded-full bg-gradient-to-r',
                    colorClass
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">
                    {sat.nameCn}
                  </div>
                  <div className="text-xs text-white/50 truncate">{sat.name}</div>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                  {sat.typeCn}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40">
                  {sat.country}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </GlassPanel>
  );
}
