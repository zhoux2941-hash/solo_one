import { useCircuitStore, PRESETS } from '@/store/circuitStore';

export default function PresetSelector() {
  const { activePreset, setActivePreset } = useCircuitStore();

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
      <div className="glass-card p-5 glass-card-hover transition-all duration-300">
        <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400 mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-glow-pulse" />
          预设场景
        </h2>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => {
            const isActive = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setActivePreset(preset.id)}
                className={`
                  group relative px-4 py-2.5 rounded-lg text-xs font-medium
                  transition-all duration-300 cursor-pointer
                  ${
                    isActive
                      ? 'bg-cyan-400/15 border border-cyan-400/40 text-cyan-400 glow-cyan'
                      : 'bg-navy-700/50 border border-navy-500/50 text-slate-400 hover:border-cyan-400/20 hover:text-slate-300'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{preset.icon}</span>
                  <div className="text-left">
                    <div className="font-bold">{preset.name}</div>
                    <div className={`text-[9px] ${isActive ? 'text-cyan-400/60' : 'text-slate-500'}`}>
                      {preset.description}
                    </div>
                  </div>
                </div>
                {isActive && (
                  <div className="absolute -top-px -right-px w-2 h-2 rounded-bl bg-cyan-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
