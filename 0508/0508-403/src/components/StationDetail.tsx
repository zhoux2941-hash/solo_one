import { useAppStore } from '@/store/useAppStore';
import { stationMap, lineMap, transferMap } from '@/data/railwayConfig';
import { findRoute } from '@/utils/routeAlgorithm';
import { X } from 'lucide-react';

const MAJOR_CITY_IDS = ['beijing', 'shanghai', 'guangzhounan', 'wuhan', 'chengdu', 'xian', 'harbin', 'kunming'];

export default function StationDetail() {
  const selectedStationId = useAppStore((s) => s.selectedStationId);
  const selectStation = useAppStore((s) => s.selectStation);

  if (!selectedStationId) return null;

  const station = stationMap[selectedStationId];
  if (!station) return null;

  const stationTransfers = transferMap[selectedStationId] ?? [];

  const cityRoutes = MAJOR_CITY_IDS.map((cityId) => {
    const targetStation = stationMap[cityId];
    if (!targetStation || targetStation.id === selectedStationId) return null;
    const route = findRoute(selectedStationId, targetStation.id);
    const minutes = route?.totalMinutes ?? null;
    return { city: targetStation.name, minutes };
  });

  return (
    <div
      className={`fixed top-0 right-0 h-full w-96 bg-slate-900/95 backdrop-blur-md z-50 shadow-2xl transition-transform duration-300 ease-in-out ${
        selectedStationId ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex flex-col h-full text-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="text-xl font-bold truncate">{station.name}</h2>
          <button
            onClick={() => selectStation(null)}
            className="p-1 rounded hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          <section>
            <h3 className="text-sm font-semibold text-slate-400 mb-2">途经线路</h3>
            <div className="flex flex-wrap gap-2">
              {station.lines.map((lineId) => {
                const line = lineMap[lineId];
                if (!line) return null;
                return (
                  <span
                    key={lineId}
                    className="px-2.5 py-1 rounded text-xs font-medium text-white"
                    style={{ backgroundColor: line.color }}
                  >
                    {line.name}
                  </span>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-slate-400 mb-2">可换乘线路</h3>
            {stationTransfers.length === 0 ? (
              <p className="text-slate-500 text-sm">无换乘信息</p>
            ) : (
              <ul className="space-y-2">
                {stationTransfers.map((t, i) => {
                  const fromLine = lineMap[t.fromLineId];
                  const toLine = lineMap[t.toLineId];
                  return (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{ backgroundColor: fromLine?.color ?? '#475569' }}
                      >
                        {fromLine?.name ?? t.fromLineId}
                      </span>
                      <span className="text-slate-400">→</span>
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{ backgroundColor: toLine?.color ?? '#475569' }}
                      >
                        {toLine?.name ?? t.toLineId}
                      </span>
                      <span className="text-slate-400 text-xs ml-auto">
                        换乘 {t.transferMinutes} 分钟
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <h3 className="text-sm font-semibold text-slate-400 mb-2">到主要城市预计时间</h3>
            <ul className="space-y-1.5">
              {cityRoutes.map((item) => {
                if (!item) return null;
                return (
                  <li
                    key={item.city}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-slate-300">{item.city}</span>
                    <span className="text-slate-400">
                      {item.minutes !== null ? `约 ${Math.round(item.minutes / 60 * 10) / 10} 小时` : '—'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
