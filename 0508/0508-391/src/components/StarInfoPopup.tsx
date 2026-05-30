import { X } from 'lucide-react';
import { useStarMapStore } from '../store/useStarMapStore';

export const StarInfoPopup = () => {
  const { stars, constellations, selectedStarId, setSelectedStarId } = useStarMapStore();

  const selectedStar = stars.find((s) => s.id === selectedStarId);
  const constellation = selectedStar?.constellationId
    ? constellations.find((c) => c.id === selectedStar.constellationId)
    : null;

  if (!selectedStar) return null;

  return (
    <div className="fixed top-6 right-6 w-72 bg-slate-900/95 backdrop-blur-sm rounded-xl border border-amber-900/50 shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-amber-900/50 to-amber-800/30 px-4 py-3 flex items-center justify-between">
        <h3 className="text-lg font-bold text-amber-100 font-serif">
          {selectedStar.name}
        </h3>
        <button
          onClick={() => setSelectedStarId(null)}
          className="text-amber-200/60 hover:text-amber-100 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {selectedStar.traditionalName && (
          <div className="border-b border-amber-900/30 pb-2">
            <span className="text-xs text-amber-200/50">别名</span>
            <p className="text-amber-100 font-serif">{selectedStar.traditionalName}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-xs text-amber-200/50">星等</span>
            <p className="text-amber-100">{selectedStar.magnitude.toFixed(2)}</p>
            <div className="mt-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-200"
                style={{ width: `${Math.max(10, (6 - selectedStar.magnitude) * 16.67)}%` }}
              />
            </div>
          </div>

          <div>
            <span className="text-xs text-amber-200/50">赤经 (RA)</span>
            <p className="text-amber-100">{selectedStar.ra.toFixed(2)}h</p>
          </div>

          <div>
            <span className="text-xs text-amber-200/50">赤纬 (Dec)</span>
            <p className="text-amber-100">{selectedStar.dec.toFixed(2)}°</p>
          </div>

          {selectedStar.xingguan && (
            <div>
              <span className="text-xs text-amber-200/50">星官</span>
              <p className="text-amber-100">{selectedStar.xingguan}</p>
            </div>
          )}
        </div>

        {constellation && (
          <div className="border-t border-amber-900/30 pt-3">
            <span className="text-xs text-amber-200/50">所属星官</span>
            <p className="text-amber-100 font-medium">{constellation.name}</p>
            {constellation.mansion && (
              <p className="text-xs text-amber-200/60 mt-1">{constellation.mansion}</p>
            )}
            {constellation.description && (
              <p className="text-xs text-amber-200/50 mt-1 italic">
                {constellation.description}
              </p>
            )}
          </div>
        )}

        <div className="border-t border-amber-900/30 pt-3">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full bg-amber-100 shadow-lg shadow-amber-500/50"
            />
            <span className="text-xs text-amber-200/50">亮度</span>
          </div>
          <div className="mt-2 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
              key={i}
              className={`w-2 h-2 rounded-full ${i < Math.max(1, Math.round(6 - selectedStar.magnitude))
                  ? 'bg-amber-400'
                  : 'bg-slate-700'
              }`}
            />
          ))}
          </div>
        </div>
      </div>
    </div>
  );
};
