import { useAppStore } from '@/store/useAppStore';
import { stationMap, lineMap, stations } from '@/data/railwayConfig';
import { X, Star, ArrowDown } from 'lucide-react';

function useIsCurrentRouteFavorite() {
  const routeFrom = useAppStore((s) => s.routeFrom);
  const routeTo = useAppStore((s) => s.routeTo);
  const favorites = useAppStore((s) => s.favorites);
  const fromStation = stations.find((s) => s.name === routeFrom);
  const toStation = stations.find((s) => s.name === routeTo);
  if (!fromStation || !toStation) return false;
  return favorites.some(
    (f) => f.fromStationId === fromStation.id && f.toStationId === toStation.id
  );
}

export default function RouteResult() {
  const routeResult = useAppStore((s) => s.routeResult);
  const routeFrom = useAppStore((s) => s.routeFrom);
  const routeTo = useAppStore((s) => s.routeTo);
  const clearRoute = useAppStore((s) => s.clearRoute);
  const addFavorite = useAppStore((s) => s.addFavorite);
  const selectStation = useAppStore((s) => s.selectStation);
  const isFav = useIsCurrentRouteFavorite();

  if (!routeResult) return null;

  const hours = Math.floor(routeResult.totalMinutes / 60);
  const mins = routeResult.totalMinutes % 60;
  const timeStr = hours > 0 ? `${hours}小时${mins > 0 ? mins + '分钟' : ''}` : `${mins}分钟`;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-[600px] max-h-[70vh] bg-slate-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-700/50 flex flex-col">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-sm">{routeFrom}</span>
          <ArrowDown className="w-4 h-4 text-slate-400 rotate-[-90deg]" />
          <span className="text-white font-bold text-sm">{routeTo}</span>
          <span className="text-amber-400 font-bold ml-2">{timeStr}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={addFavorite}
            className={`p-1.5 rounded transition-colors ${
              isFav
                ? 'text-amber-400 hover:text-amber-300'
                : 'text-slate-400 hover:text-amber-400'
            }`}
            title="收藏路线"
          >
            <Star className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={clearRoute}
            className="p-1.5 rounded text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-3">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-slate-400 text-xs">途经线路：</span>
          {routeResult.segments.map((seg, i) => {
            const line = lineMap[seg.lineId];
            return (
              <span
                key={i}
                className="px-2 py-0.5 rounded text-xs font-medium text-white"
                style={{ backgroundColor: line?.color ?? '#475569' }}
              >
                {line?.name ?? seg.lineId}
              </span>
            );
          })}
        </div>

        <div className="space-y-0">
          {routeResult.stationPath.map((stationId, i) => {
            const station = stationMap[stationId];
            if (!station) return null;
            const isFirst = i === 0;
            const isLast = i === routeResult.stationPath.length - 1;
            const isTransfer = routeResult.transfers.some(
              (t) => t.stationId === stationId
            );
            const segmentIndex = routeResult.segments.findIndex((seg) =>
              seg.stationIds.includes(stationId)
            );
            const lineId =
              segmentIndex >= 0 ? routeResult.segments[segmentIndex].lineId : null;
            const line = lineId ? lineMap[lineId] : null;

            return (
              <div key={stationId + i} className="flex items-start gap-3">
                <div className="flex flex-col items-center w-5 shrink-0">
                  <div
                    className={`w-3 h-3 rounded-full border-2 ${
                      isFirst || isLast
                        ? 'border-amber-400 bg-amber-400'
                        : isTransfer
                        ? 'border-cyan-400 bg-cyan-400'
                        : 'border-slate-500 bg-slate-800'
                    }`}
                    style={
                      !isFirst && !isLast && !isTransfer && line
                        ? { borderColor: line.color }
                        : undefined
                    }
                  />
                  {!isLast && (
                    <div
                      className="w-0.5 flex-1 min-h-[24px]"
                      style={{ backgroundColor: line?.color ?? '#475569' }}
                    />
                  )}
                </div>
                <div className="pb-3 flex-1 min-w-0">
                  <button
                    onClick={() => selectStation(stationId)}
                    className={`text-sm font-medium ${
                      isFirst || isLast
                        ? 'text-amber-400'
                        : isTransfer
                        ? 'text-cyan-400'
                        : 'text-slate-300'
                    } hover:underline`}
                  >
                    {station.name}
                  </button>
                  {isTransfer && (
                    <span className="ml-2 text-xs text-cyan-400/70">换乘</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
