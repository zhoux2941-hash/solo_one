import { useState, useEffect, useMemo } from 'react';
import { GlassPanel } from '@/components/UI/GlassPanel';
import { useSatellite } from '@/hooks/useSatellite';
import { useAppStore } from '@/store/appStore';
import { predictPasses } from '@/core/passes';
import {
  Calendar,
  Clock,
  Sun,
  Compass,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';

export function PassPrediction() {
  const selectedSatellite = useAppStore((s) => s.selectedSatellite);
  const userLocation = useAppStore((s) => s.userLocation);
  const passPredictions = useAppStore((s) => s.passPredictions);
  const setPassPredictions = useAppStore((s) => s.setPassPredictions);
  const isLoadingPasses = useAppStore((s) => s.isLoadingPasses);
  const setIsLoadingPasses = useAppStore((s) => s.setIsLoadingPasses);

  const { satrec, epochDate } = useSatellite(selectedSatellite);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  useEffect(() => {
    if (!satrec || !selectedSatellite || !userLocation) return;

    setIsLoadingPasses(true);
    const timer = setTimeout(() => {
      const passes = predictPasses(
        satrec,
        epochDate,
        { lat: userLocation.lat, lon: userLocation.lon, alt: userLocation.alt },
        selectedSatellite,
        7
      );
      setPassPredictions(passes);
      setIsLoadingPasses(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [satrec, selectedSatellite, userLocation, epochDate, setPassPredictions, setIsLoadingPasses]);

  const totalPassStats = useMemo(() => {
    let total = 0;
    let visible = 0;
    passPredictions.forEach((d) => {
      total += d.passes.length;
      visible += d.passes.filter((p) => p.isVisible).length;
    });
    return { total, visible };
  }, [passPredictions]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' });
  };

  const formatAz = (az: number) => {
    if (az >= 337.5 || az < 22.5) return '北';
    if (az >= 22.5 && az < 67.5) return '东北';
    if (az >= 67.5 && az < 112.5) return '东';
    if (az >= 112.5 && az < 157.5) return '东南';
    if (az >= 157.5 && az < 202.5) return '南';
    if (az >= 202.5 && az < 247.5) return '西南';
    if (az >= 247.5 && az < 292.5) return '西';
    return '西北';
  };

  const formatMagnitude = (mag: number, isVisible: boolean) => {
    if (!isVisible || mag >= 99) return '不可见';
    return `${mag.toFixed(1)} mag`;
  };

  if (!selectedSatellite) return null;

  return (
    <GlassPanel className="w-80 absolute right-6 top-[380px] bottom-28 overflow-hidden flex flex-col" glow="cyan">
      <div className="p-4 border-b border-white/10">
        <h2
          className="text-lg font-bold text-cyan-300 flex items-center gap-2"
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          <Calendar size={20} />
          过境预测
        </h2>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-white/50">
            {userLocation.name || '观测点'} · 未来7天
          </p>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-emerald-400 flex items-center gap-1">
              <Eye size={10} />
              {totalPassStats.visible} 可见
            </span>
            <span className="text-white/40">/</span>
            <span className="text-white/50">{totalPassStats.total} 总过境</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {isLoadingPasses ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Loader2 size={32} className="text-cyan-400 animate-spin" />
            <p className="text-sm text-white/50">正在计算过境时间...</p>
          </div>
        ) : totalPassStats.total === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
            <Sparkles size={32} className="text-white/30" />
            <p className="text-sm text-white/50">未来7天无过境</p>
            <p className="text-xs text-white/30">请调整观测位置</p>
          </div>
        ) : (
          <div className="space-y-2">
            {passPredictions.map((day) => {
              if (day.passes.length === 0) return null;
              const isExpanded = expandedDay === day.date;
              const visibleCount = day.passes.filter((p) => p.isVisible).length;

              return (
                <div
                  key={day.date}
                  className="rounded-xl border border-white/10 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedDay(isExpanded ? null : day.date)}
                    className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar size={14} className="text-cyan-400" />
                      <span className="text-sm font-medium text-white">
                        {formatDate(day.date)}
                      </span>
                      <span className="text-xs text-white/50">
                        {day.passes.length} 次
                      </span>
                      {visibleCount > 0 && (
                        <span className="text-xs text-emerald-400 flex items-center gap-1">
                          <Eye size={10} />
                          {visibleCount} 可见
                        </span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-white/50" />
                    ) : (
                      <ChevronDown size={16} className="text-white/50" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="divide-y divide-white/5 bg-white/[0.02]">
                      {day.passes.map((pass, idx) => (
                        <div
                          key={idx}
                          className={`p-3 space-y-2 ${
                            pass.isVisible
                              ? 'bg-emerald-500/5 border-l-2 border-l-emerald-500/50'
                              : 'border-l-2 border-l-transparent'
                          }`}
                        >
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1.5 text-white/70">
                              <Clock size={12} />
                              <span>
                                {formatTime(pass.startTime)} -{' '}
                                {formatTime(pass.endTime)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {pass.isVisible ? (
                                <span
                                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400"
                                >
                                  <Eye size={10} />
                                  可见
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/40"
                                >
                                  <EyeOff size={10} />
                                  不可见
                                </span>
                              )}
                              <span
                                className={
                                  pass.maxElevation > 70
                                    ? 'text-emerald-400 font-medium'
                                    : pass.maxElevation > 40
                                    ? 'text-cyan-400'
                                    : 'text-white/60'
                                }
                              >
                                {pass.maxElevation.toFixed(0)}°
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="space-y-0.5">
                              <div
                                className="text-white/40 flex items-center gap-1"
                              >
                                <Compass size={10} />
                                方位
                              </div>
                              <div className="text-white/80">
                                {formatAz(pass.startAz)} →{' '}
                                {formatAz(pass.endAz)}
                              </div>
                            </div>
                            <div className="space-y-0.5">
                              <div
                                className="text-white/40 flex items-center gap-1"
                              >
                                <Sun size={10} />
                                最高仰角
                              </div>
                              <div className="text-white/80">
                                {pass.maxElevation.toFixed(1)}°
                              </div>
                            </div>
                            <div className="space-y-0.5">
                              <div
                                className="text-white/40 flex items-center gap-1"
                              >
                                <Sparkles size={10} />
                                亮度
                              </div>
                              <div
                                className={
                                  pass.isVisible && pass.magnitude < 2
                                    ? 'text-yellow-400 font-medium'
                                    : 'text-white/60'
                                }
                              >
                                {formatMagnitude(
                                  pass.magnitude,
                                  pass.isVisible
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-white/10 text-[10px] text-white/30 space-y-1">
        <div className="flex items-center justify-between">
          <span>可见判定：</span>
          <span>卫星被太阳照亮 + 观测者在晨昏蒙影外</span>
        </div>
        <div className="flex items-center justify-between">
          <span>亮度公式：</span>
          <span>基准亮度 × 距离² × 相位角衰减</span>
        </div>
      </div>
    </GlassPanel>
  );
}
