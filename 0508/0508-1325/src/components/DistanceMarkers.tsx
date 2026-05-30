import { DISTANCE_ZONES } from '@/config/gameConfig';

export function DistanceMarkers() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {DISTANCE_ZONES.map((zone) => (
        <div key={zone.zone} className="absolute w-full" style={{ top: `${zone.minY}%` }}>
          <div
            className="absolute inset-x-4 border-t-2 border-dashed opacity-50"
            style={{ borderColor: zone.color }}
          />
          <div
            className="absolute left-4 px-3 py-1 rounded-full text-white text-sm font-bold transform -translate-y-1/2"
            style={{ backgroundColor: zone.color }}
          >
            {zone.label}
          </div>
        </div>
      ))}
      
      {DISTANCE_ZONES.map((zone) => (
        <div
          key={`bg-${zone.zone}`}
          className="absolute left-0 right-0 opacity-10"
          style={{
            top: `${zone.minY}%`,
            height: `${zone.maxY - zone.minY}%`,
            backgroundColor: zone.color,
          }}
        />
      ))}
    </div>
  );
}
