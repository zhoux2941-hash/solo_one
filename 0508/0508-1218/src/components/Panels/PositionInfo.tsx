import { GlassPanel } from '@/components/UI/GlassPanel';
import { useSatellite } from '@/hooks/useSatellite';
import { useAppStore } from '@/store/appStore';
import { Globe, MapPin, TrendingUp, Gauge, Sun, Moon, Layers } from 'lucide-react';
import { SatelliteClass } from '@/types';
import { MAGNITUDE_CONFIG } from '@/core/sunlight';

const CLASS_NAMES: Record<SatelliteClass, string> = {
  [SatelliteClass.ISS]: '国际空间站',
  [SatelliteClass.LARGE_SATELLITE]: '大型卫星',
  [SatelliteClass.NAVIGATION]: '导航卫星',
  [SatelliteClass.TELESCOPE]: '太空望远镜',
  [SatelliteClass.COMMUNICATION]: '通信卫星',
  [SatelliteClass.WEATHER]: '气象卫星',
  [SatelliteClass.SMALL_SATELLITE]: '小型卫星',
  [SatelliteClass.ROCKET_BODY]: '火箭残骸',
};

export function PositionInfo() {
  const selectedSatellite = useAppStore((s) => s.selectedSatellite);
  const { lla, position } = useSatellite(selectedSatellite);

  if (!selectedSatellite) return null;

  const satConfig = MAGNITUDE_CONFIG[selectedSatellite.satelliteClass];

  const formatLat = (lat: number) => {
    const dir = lat >= 0 ? 'N' : 'S';
    return `${Math.abs(lat).toFixed(4)}° ${dir}`;
  };

  const formatLon = (lon: number) => {
    const dir = lon >= 0 ? 'E' : 'W';
    return `${Math.abs(lon).toFixed(4)}° ${dir}`;
  };

  const formatAlt = (alt: number) => {
    if (alt > 1000) return `${(alt / 1000).toFixed(2)} km`;
    return `${alt.toFixed(1)} km`;
  };

  const formatVelocity = (vx: number, vy: number, vz: number) => {
    const v = Math.sqrt(vx * vx + vy * vy + vz * vz);
    return `${v.toFixed(2)} km/s`;
  };

  return (
    <GlassPanel className="w-80 absolute right-6 top-6" glow="green">
      <div className="p-4 border-b border-white/10">
        <h2
          className="text-lg font-bold text-emerald-300 flex items-center gap-2"
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          <MapPin size={20} />
          当前位置
        </h2>
        <p className="text-xs text-white/50 mt-1">
          {selectedSatellite.nameCn} ({selectedSatellite.name})
        </p>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              <Globe size={12} />
              纬度
            </div>
            <div
              className="text-2xl font-bold text-white"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              {lla ? formatLat(lla.lat) : '--'}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              <Globe size={12} />
              经度
            </div>
            <div
              className="text-2xl font-bold text-white"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              {lla ? formatLon(lla.lon) : '--'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              <TrendingUp size={12} />
              轨道高度
            </div>
            <div
              className="text-xl font-bold text-emerald-300"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              {lla ? formatAlt(lla.alt) : '--'}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              <Gauge size={12} />
              飞行速度
            </div>
            <div
              className="text-xl font-bold text-cyan-300"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              {position ? formatVelocity(position.vx, position.vy, position.vz) : '--'}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-white/10 text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-white/40">NORAD ID</span>
            <span className="text-white/60 font-mono">{selectedSatellite.noradId}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/40 flex items-center gap-1">
              <Layers size={10} />
              类型分类
            </span>
            <span className="text-emerald-400/80 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-400/30">
              {CLASS_NAMES[selectedSatellite.satelliteClass] || '未知'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/40">截面面积</span>
            <span className="text-white/60 font-mono">{selectedSatellite.crossSection} m²</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/40 flex items-center gap-1">
              <Sun size={10} />
              基准亮度
            </span>
            <span className="text-yellow-400/80">{satConfig?.baseMag.toFixed(1)} mag</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/40">所属国家</span>
            <span className="text-white/60">{selectedSatellite.country}</span>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
