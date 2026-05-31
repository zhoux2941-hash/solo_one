import { useGeoHashStore } from "@/hooks/useGeoHashStore";
import { batchEncode, getPrecisionInfo } from "@/utils/geohash";
import { Layers, Copy, Ruler } from "lucide-react";

export default function BatchPanel() {
  const { batchInput, precision, batchResults, setBatchInput, setPrecision, setBatchResults, setDecodeResult, setNeighbors, setEncodeResult } = useGeoHashStore();

  const handleBatchEncode = () => {
    const results = batchEncode(batchInput, precision);
    setBatchResults(results);
  };

  const handleCopyAll = () => {
    const text = batchResults.map((r) => `${r.center.lat},${r.center.lng} → ${r.hash}`).join("\n");
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Layers className="w-5 h-5 text-teal-400" />
        <h2 className="text-lg font-bold text-slate-100">批量转换</h2>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">
          输入经纬度（每行一对，逗号分隔）
        </label>
        <textarea
          value={batchInput}
          onChange={(e) => setBatchInput(e.target.value)}
          placeholder={"39.9042,116.4074\n40.6892,-74.0445\n48.8584,2.2945"}
          rows={5}
          className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500/50 focus:border-teal-500/50 transition resize-none"
        />
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
        <div className="mt-2 bg-slate-800/40 rounded-lg border border-slate-700/40 p-2.5">
          <div className="grid grid-cols-4 gap-1.5 text-[10px]">
            <div className="text-center">
              <div className="text-slate-500">经度尺寸</div>
              <div className="text-amber-400 font-mono">{getPrecisionInfo(precision).lngSize}</div>
            </div>
            <div className="text-center">
              <div className="text-slate-500">纬度尺寸</div>
              <div className="text-amber-400 font-mono">{getPrecisionInfo(precision).latSize}</div>
            </div>
            <div className="text-center">
              <div className="text-slate-500">经度范围</div>
              <div className="text-slate-300 font-mono">{getPrecisionInfo(precision).lngRange}</div>
            </div>
            <div className="text-center">
              <div className="text-slate-500">纬度范围</div>
              <div className="text-slate-300 font-mono">{getPrecisionInfo(precision).latRange}</div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleBatchEncode}
        className="w-full bg-teal-600 hover:bg-teal-500 text-white rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-teal-500/20 active:scale-[0.98]"
      >
        <Layers className="w-4 h-4" />
        批量编码
      </button>

      {batchResults.length > 0 && (
        <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">批量结果 ({batchResults.length} 条)</span>
            <button
              onClick={handleCopyAll}
              className="text-[10px] text-teal-400 hover:text-teal-300 flex items-center gap-1 transition"
            >
              <Copy className="w-3 h-3" />
              复制全部
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {batchResults.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-slate-900/60 rounded-lg px-3 py-2 hover:bg-slate-800/80 transition-colors cursor-pointer"
                onClick={() => {
                  setDecodeResult(r);
                  setEncodeResult(r);
                  setNeighbors({});
                }}
              >
                <div className="text-[11px] text-slate-400 font-mono">
                  {r.center.lat.toFixed(4)}, {r.center.lng.toFixed(4)}
                </div>
                <div className="text-sm text-amber-400 font-mono font-bold">{r.hash}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
