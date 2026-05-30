import ChinaMap from '@/components/ChinaMap';
import DynastySelector from '@/components/DynastySelector';
import ErrorSourcePanel from '@/components/ErrorSourcePanel';
import TrendChart from '@/components/TrendChart';
import MapArchive from '@/components/MapArchive';
import { useMapStore } from '@/store/useMapStore';
import { Eye, EyeOff } from 'lucide-react';

export default function Home() {
  const { selectedDynasty, showErrorLayer, toggleErrorLayer } = useMapStore();

  return (
    <div className="h-screen w-screen bg-[#0f0f1a] overflow-hidden flex flex-col">
      <header className="shrink-0 border-b border-[#c9a96e]/10 bg-[#0f0f1a]/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#c9a96e]/10 border border-[#c9a96e]/20 flex items-center justify-center">
              <span
                className="text-[#c9a96e] text-sm font-bold"
                style={{ fontFamily: "'Noto Serif SC', serif" }}
              >
                舆
              </span>
            </div>
            <div>
              <h1
                className="text-base font-bold text-[#f5f0e8]/90 tracking-wide"
                style={{ fontFamily: "'Noto Serif SC', serif" }}
              >
                历代地图绘制误差与疆域认知演变
              </h1>
              <p className="text-[10px] text-[#f5f0e8]/25 tracking-wider">
                CARTOGRAPHIC ERRORS & TERRITORIAL COGNITION EVOLUTION
              </p>
            </div>
          </div>

          <DynastySelector />

          <button
            onClick={toggleErrorLayer}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all duration-300
              ${showErrorLayer
                ? "bg-[#c23616]/15 border border-[#c23616]/30 text-[#c23616]/80"
                : "bg-[#f5f0e8]/5 border border-[#f5f0e8]/10 text-[#f5f0e8]/30"
              }
            `}
          >
            {showErrorLayer ? <Eye size={14} /> : <EyeOff size={14} />}
            <span>{showErrorLayer ? "误差层" : "已隐藏"}</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 relative overflow-hidden">
          <ChinaMap />

          <div className="absolute top-4 left-4">
            <div
              className="bg-[#1a1a2e]/90 backdrop-blur-sm border border-[#c9a96e]/20 rounded-lg px-4 py-2.5"
              style={{ animation: "fadeIn 0.5s ease" }}
            >
              <div className="text-[10px] text-[#f5f0e8]/25 tracking-wider mb-1">当前朝代</div>
              <div className="flex items-center gap-2">
                <span
                  className="text-2xl font-bold text-[#c9a96e]"
                  style={{ fontFamily: "'Noto Serif SC', serif" }}
                >
                  {selectedDynasty.name}
                </span>
                <span className="text-xs text-[#f5f0e8]/40">{selectedDynasty.period}</span>
              </div>
            </div>
          </div>
        </main>

        <aside className="w-[340px] shrink-0 border-l border-[#c9a96e]/10 bg-[#0f0f1a] overflow-y-auto">
          <div className="p-4 space-y-5">
            <MapArchive />
            <ErrorSourcePanel />
            <TrendChart />

            <div className="text-center py-4">
              <p className="text-[10px] text-[#f5f0e8]/15 leading-relaxed">
                从唐代到明代，中国古地图经历了从传说到实测的漫长演进<br />
                误差逐渐缩小，疆域认知日趋精准
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
