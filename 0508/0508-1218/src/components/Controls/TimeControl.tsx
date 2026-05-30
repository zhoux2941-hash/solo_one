import { GlassPanel } from '@/components/UI/GlassPanel';
import { GlowButton } from '@/components/UI/GlowButton';
import { useAppStore } from '@/store/appStore';
import { Play, Pause, FastForward, Clock, MapPin, X } from 'lucide-react';
import { useState } from 'react';
import { MapPicker } from '@/components/Controls/MapPicker';

const SPEED_OPTIONS = [
  { label: '1×', value: 1 },
  { label: '10×', value: 10 },
  { label: '100×', value: 100 },
  { label: '1000×', value: 1000 },
];

export function TimeControl() {
  const isPlaying = useAppStore((s) => s.isPlaying);
  const setIsPlaying = useAppStore((s) => s.setIsPlaying);
  const timeSpeed = useAppStore((s) => s.timeSpeed);
  const setTimeSpeed = useAppStore((s) => s.setTimeSpeed);
  const simulatedTime = useAppStore((s) => s.simulatedTime);
  const setSimulatedTime = useAppStore((s) => s.setSimulatedTime);
  const userLocation = useAppStore((s) => s.userLocation);
  const showLocationModal = useAppStore((s) => s.showLocationModal);
  const setShowLocationModal = useAppStore((s) => s.setShowLocationModal);

  const formatTime = (d: Date) => {
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const resetToNow = () => {
    setSimulatedTime(new Date());
  };

  return (
    <>
      <GlassPanel className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-4" glow="cyan">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <GlowButton
              variant="primary"
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-12 h-12 rounded-full flex items-center justify-center p-0"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
            </GlowButton>

            <div className="flex bg-white/5 rounded-xl p-1">
              {SPEED_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTimeSpeed(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                    timeSpeed === opt.value
                      ? 'bg-cyan-500/30 text-cyan-300 shadow-[0_0_15px_rgba(0,212,255,0.3)]'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  <FastForward size={12} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-10 w-px bg-white/10" />

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Clock size={12} />
              模拟时间
            </div>
            <div className="text-white font-mono text-sm">{formatTime(simulatedTime)}</div>
          </div>

          <div className="h-10 w-px bg-white/10" />

          <button
            onClick={resetToNow}
            className="px-3 py-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            重置到现在
          </button>

          <div className="h-10 w-px bg-white/10" />

          <button
            onClick={() => setShowLocationModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
          >
            <MapPin size={16} className="text-emerald-400" />
            <div className="text-left">
              <div className="text-xs text-white/50">观测点</div>
              <div className="text-sm text-white font-medium">
                {userLocation.name || `${userLocation.lat.toFixed(2)}, ${userLocation.lon.toFixed(2)}`}
              </div>
            </div>
          </button>
        </div>
      </GlassPanel>

      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <GlassPanel className="w-[700px] max-w-[95vw]" glow="green">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-emerald-300 flex items-center gap-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                <MapPin size={20} />
                设置观测位置
              </h3>
              <button
                onClick={() => setShowLocationModal(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <MapPicker />
            </div>
          </GlassPanel>
        </div>
      )}
    </>
  );
}
