import { useGeoHashStore } from "@/hooks/useGeoHashStore";
import { encodeGeoHash, decodeGeoHash, getPrecisionInfo } from "@/utils/geohash";
import { Hash, MapPin, Ruler } from "lucide-react";

export default function EncodePanel() {
  const { lat, lng, precision, encodeResult, setLat, setLng, setPrecision, setEncodeResult, setDecodeResult, setNeighbors } = useGeoHashStore();

  const handleEncode = () => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) return;
    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) return;

    const hash = encodeGeoHash(latNum, lngNum, precision);
    const { center, bbox } = decodeGeoHash(hash);
    const result = { hash, center, bbox, precision };
    setEncodeResult(result);
    setDecodeResult(result);
    setNeighbors({});
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <MapPin className="w-5 h-5 text-teal-400" />
        <h2 className="text-lg font-bold text-slate-100">经纬度 → GeoHash</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">纬度 (Lat)</label>
          <input
            type="text"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="-90 ~ 90"
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500/50 focus:border-teal-500/50 transition"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">经度 (Lng)</label>
          <input
            type="text"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="-180 ~ 180"
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500/50 focus:border-teal-500/50 transition"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">
          精度: <span className="text-amber-400 font-bold">{precision}</span> 字符
          <span className="text-teal-400 ml-2">({getPrecisionInfo(precision).description})</span>
        </label>
        <input
          type="range"
          min={1}
          max={12}
          value={precision}
          onChange={(e) => setPrecision(Number(e.target.value))}
          className="w-full accent-teal-500"
        />
        <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
          <span>1 (粗略)</span>
          <span>6 (街区)</span>
          <span>12 (精确)</span>
        </div>
        <div className="mt-3 bg-slate-800/40 rounded-lg border border-slate-700/40 p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-2">
            <Ruler className="w-3 h-3 text-teal-400" />
            <span>当前精度网格尺寸</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-500">经度范围</span>
              <div className="text-slate-200 font-mono">{getPrecisionInfo(precision).lngRange}</div>
            </div>
            <div>
              <span className="text-slate-500">纬度范围</span>
              <div className="text-slate-200 font-mono">{getPrecisionInfo(precision).latRange}</div>
            </div>
            <div>
              <span className="text-slate-500">经度尺寸</span>
              <div className="text-amber-400 font-mono">{getPrecisionInfo(precision).lngSize}</div>
            </div>
            <div>
              <span className="text-slate-500">纬度尺寸</span>
              <div className="text-amber-400 font-mono">{getPrecisionInfo(precision).latSize}</div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleEncode}
        className="w-full bg-teal-600 hover:bg-teal-500 text-white rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-teal-500/20 active:scale-[0.98]"
      >
        <Hash className="w-4 h-4" />
        生成 GeoHash
      </button>

      {encodeResult && (
        <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">GeoHash</span>
            <button
              onClick={() => navigator.clipboard.writeText(encodeResult.hash)}
              className="text-[10px] text-teal-400 hover:text-teal-300 transition"
            >
              复制
            </button>
          </div>
          <div className="font-mono text-2xl font-bold text-amber-400 tracking-wider">
            {encodeResult.hash}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900/60 rounded-lg p-2">
              <div className="text-slate-500">中心点</div>
              <div className="text-slate-300 font-mono">
                {encodeResult.center.lat.toFixed(6)}, {encodeResult.center.lng.toFixed(6)}
              </div>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-2">
              <div className="text-slate-500">精度</div>
              <div className="text-slate-300 font-mono">{encodeResult.precision} 字符</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
