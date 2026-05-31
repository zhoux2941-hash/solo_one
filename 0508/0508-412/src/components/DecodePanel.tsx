import { useGeoHashStore } from "@/hooks/useGeoHashStore";
import { decodeGeoHash, isValidGeoHash, getNeighbors } from "@/utils/geohash";
import { Search } from "lucide-react";

export default function DecodePanel() {
  const { geoHashInput, decodeResult, neighbors, setGeoHashInput, setDecodeResult, setNeighbors, setEncodeResult } = useGeoHashStore();

  const handleDecode = () => {
    const hash = geoHashInput.trim().toLowerCase();
    if (!hash || !isValidGeoHash(hash)) return;

    const { center, bbox } = decodeGeoHash(hash);
    const result = { hash, center, bbox, precision: hash.length };
    setDecodeResult(result);
    setEncodeResult(result);
    const nb = getNeighbors(hash);
    setNeighbors(nb);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Search className="w-5 h-5 text-teal-400" />
        <h2 className="text-lg font-bold text-slate-100">GeoHash → 经纬度</h2>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">输入 GeoHash</label>
        <input
          type="text"
          value={geoHashInput}
          onChange={(e) => setGeoHashInput(e.target.value)}
          placeholder="如 wx4g0s"
          className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500/50 focus:border-teal-500/50 transition"
        />
      </div>

      <button
        onClick={handleDecode}
        className="w-full bg-amber-600 hover:bg-amber-500 text-white rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-amber-500/20 active:scale-[0.98]"
      >
        <Search className="w-4 h-4" />
        解码 GeoHash
      </button>

      {decodeResult && (
        <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4 space-y-3">
          <div className="text-xs text-slate-500 mb-1">解码结果</div>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="bg-slate-900/60 rounded-lg p-2.5">
              <div className="text-slate-500 mb-0.5">中心点坐标</div>
              <div className="text-amber-400 font-mono text-sm">
                {decodeResult.center.lat.toFixed(6)}, {decodeResult.center.lng.toFixed(6)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-900/60 rounded-lg p-2.5">
                <div className="text-slate-500 mb-0.5">纬度范围</div>
                <div className="text-slate-300 font-mono">
                  {decodeResult.bbox.minLat.toFixed(4)} ~ {decodeResult.bbox.maxLat.toFixed(4)}
                </div>
              </div>
              <div className="bg-slate-900/60 rounded-lg p-2.5">
                <div className="text-slate-500 mb-0.5">经度范围</div>
                <div className="text-slate-300 font-mono">
                  {decodeResult.bbox.minLng.toFixed(4)} ~ {decodeResult.bbox.maxLng.toFixed(4)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {Object.keys(neighbors).length > 0 && (
        <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4 space-y-2">
          <div className="text-xs text-slate-500 mb-2">相邻8个区域</div>
          <div className="grid grid-cols-3 gap-1.5">
            {["nw", "n", "ne", "w", "", "e", "sw", "s", "se"].map((dir) => {
              if (dir === "") {
                return (
                  <div key="center" className="bg-teal-900/40 border border-teal-700/30 rounded-lg p-1.5 text-center">
                    <div className="text-amber-400 font-mono text-[10px] font-bold truncate">
                      {decodeResult?.hash}
                    </div>
                  </div>
                );
              }
              return (
                <button
                  key={dir}
                  onClick={() => {
                    setGeoHashInput(neighbors[dir]);
                  }}
                  className="bg-slate-900/60 hover:bg-slate-700/60 border border-slate-700/30 rounded-lg p-1.5 text-center transition-colors"
                >
                  <div className="text-slate-300 font-mono text-[10px] truncate">{neighbors[dir]}</div>
                  <div className="text-slate-600 text-[9px]">
                    {dir.toUpperCase()}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
