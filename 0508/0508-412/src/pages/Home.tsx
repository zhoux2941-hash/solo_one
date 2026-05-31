import { useGeoHashStore } from "@/hooks/useGeoHashStore";
import EncodePanel from "@/components/EncodePanel";
import DecodePanel from "@/components/DecodePanel";
import BatchPanel from "@/components/BatchPanel";
import PresetPanel from "@/components/PresetPanel";
import GeoGridCanvas from "@/components/GeoGridCanvas";
import { getNeighbors } from "@/utils/geohash";
import { MapPin, Search, Layers, Sparkles } from "lucide-react";
import { useEffect } from "react";

const TABS = [
  { key: "encode" as const, label: "编码", icon: MapPin },
  { key: "decode" as const, label: "解码", icon: Search },
  { key: "batch" as const, label: "批量", icon: Layers },
];

export default function Home() {
  const { mode, setMode, decodeResult, neighbors, setNeighbors } = useGeoHashStore();

  useEffect(() => {
    if (decodeResult && Object.keys(neighbors).length === 0) {
      const nb = getNeighbors(decodeResult.hash);
      setNeighbors(nb);
    }
  }, [decodeResult]);

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100">
      <header className="border-b border-slate-800/60 bg-[#0F172A]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-100 tracking-tight">GeoHash Codec</h1>
              <p className="text-[10px] text-slate-500 -mt-0.5">地理位置哈希编码解码器</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-slate-800/60 rounded-lg p-0.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setMode(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    mode === tab.key
                      ? "bg-teal-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800/60 p-5 shadow-xl">
              {mode === "encode" && <EncodePanel />}
              {mode === "decode" && <DecodePanel />}
              {mode === "batch" && <BatchPanel />}
            </div>

            <div className="bg-slate-900/50 rounded-2xl border border-slate-800/60 p-5 shadow-xl">
              <PresetPanel />
            </div>
          </div>

          <div className="lg:col-span-3 space-y-5">
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800/60 p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <h2 className="text-sm font-bold text-slate-300">区域网格可视化</h2>
              </div>
              {decodeResult ? (
                <GeoGridCanvas
                  centerBBox={decodeResult.bbox}
                  neighbors={neighbors}
                  currentHash={decodeResult.hash}
                />
              ) : (
                <div className="w-full h-[420px] rounded-xl border border-slate-700/30 bg-slate-800/30 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/30 flex items-center justify-center mx-auto">
                      <MapPin className="w-8 h-8 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">编码或解码后显示区域网格</p>
                      <p className="text-[10px] text-slate-600 mt-1">中心区域 + 相邻8个 GeoHash</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {decodeResult && (
              <div className="bg-slate-900/50 rounded-2xl border border-slate-800/60 p-5 shadow-xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <h2 className="text-sm font-bold text-slate-300">区域详情</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <InfoCard label="GeoHash" value={decodeResult.hash} mono highlight />
                  <InfoCard label="中心纬度" value={`${decodeResult.center.lat.toFixed(6)}°`} mono />
                  <InfoCard label="中心经度" value={`${decodeResult.center.lng.toFixed(6)}°`} mono />
                  <InfoCard label="精度等级" value={`${decodeResult.precision} 字符`} />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function InfoCard({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/30">
      <div className="text-[10px] text-slate-500 mb-1">{label}</div>
      <div className={`text-sm ${mono ? "font-mono" : ""} ${highlight ? "text-amber-400 font-bold" : "text-slate-200"}`}>
        {value}
      </div>
    </div>
  );
}
