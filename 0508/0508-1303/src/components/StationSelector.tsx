import React from 'react';
import { Radio, CheckCircle2, Circle } from 'lucide-react';
import { EarthquakeEvent, StationAnnotation, STATION_COLORS } from '../types';

interface StationSelectorProps {
  event: EarthquakeEvent | null;
  selectedStationId: string | null;
  onSelectStation: (id: string) => void;
  annotations: Record<string, StationAnnotation>;
}

const StationSelector: React.FC<StationSelectorProps> = ({
  event,
  selectedStationId,
  onSelectStation,
  annotations
}) => {
  if (!event) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
        <Radio size={16} />
        台站选择
      </h3>

      <div className="space-y-1.5">
        {event.stations.map((station, idx) => {
          const ann = annotations[station.id];
          const isAnnotated = ann && ann.pTime !== null && ann.sTime !== null;
          const isSelected = selectedStationId === station.id;
          const color = STATION_COLORS[idx % STATION_COLORS.length];

          return (
            <button
              key={station.id}
              onClick={() => onSelectStation(station.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                isSelected
                  ? 'bg-slate-700 border border-slate-500'
                  : 'hover:bg-slate-800 border border-transparent'
              }`}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: isAnnotated ? color : '#475569' }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {station.name}
                  </span>
                  {isAnnotated ? (
                    <CheckCircle2 size={12} style={{ color }} />
                  ) : (
                    <Circle size={12} className="text-slate-600" />
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  {station.lat.toFixed(1)}N, {station.lon.toFixed(1)}E
                </div>
              </div>
              {isAnnotated && ann && (
                <div className="text-right">
                  <div className="text-xs font-mono" style={{ color }}>P-S: {((ann.sTime || 0) - (ann.pTime || 0)).toFixed(1)}s</div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="pt-2 border-t border-slate-700">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>已标注台站</span>
          <span className="font-mono text-cyan-400">
            {Object.values(annotations).filter(a => a.pTime !== null && a.sTime !== null).length} / {event.stations.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StationSelector;
