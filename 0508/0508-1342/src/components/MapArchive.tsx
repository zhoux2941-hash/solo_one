import { useMapStore } from '@/store/useMapStore';
import { Map, User, Calendar, ScrollText } from 'lucide-react';

export default function MapArchive() {
  const { selectedDynasty } = useMapStore();

  return (
    <div className="bg-[#1a1a2e]/80 border border-[#c9a96e]/10 rounded-lg p-4 hover:border-[#c9a96e]/25 transition-all duration-300">
      <h3
        className="text-sm font-bold text-[#c9a96e] tracking-wider mb-3"
        style={{ fontFamily: "'Noto Serif SC', serif" }}
      >
        地图档案
      </h3>

      <div className="space-y-2.5">
        <div className="flex items-start gap-2.5">
          <Map size={14} className="text-[#c9a96e]/60 mt-0.5 shrink-0" />
          <div>
            <div className="text-[10px] text-[#f5f0e8]/30 mb-0.5">代表地图</div>
            <div
              className="text-sm text-[#f5f0e8]/90 font-medium"
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
              《{selectedDynasty.mapName}》
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <User size={14} className="text-[#c9a96e]/60 mt-0.5 shrink-0" />
          <div>
            <div className="text-[10px] text-[#f5f0e8]/30 mb-0.5">绘制者</div>
            <div className="text-sm text-[#f5f0e8]/80">{selectedDynasty.cartographer}</div>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <Calendar size={14} className="text-[#c9a96e]/60 mt-0.5 shrink-0" />
          <div>
            <div className="text-[10px] text-[#f5f0e8]/30 mb-0.5">绘制年代</div>
            <div className="text-sm text-[#f5f0e8]/80">{selectedDynasty.mapYear}</div>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <ScrollText size={14} className="text-[#c9a96e]/60 mt-0.5 shrink-0" />
          <div>
            <div className="text-[10px] text-[#f5f0e8]/30 mb-0.5">朝代时期</div>
            <div className="text-sm text-[#f5f0e8]/80">{selectedDynasty.period}</div>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[#c9a96e]/10">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#f5f0e8]/30">误差等级</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={`w-4 h-1.5 rounded-sm transition-all duration-500 ${
                  level <= Math.round(selectedDynasty.errorLevel)
                    ? level <= 2 ? "bg-[#f1c40f]/70" : level <= 3 ? "bg-[#e67e22]/70" : "bg-[#c23616]/70"
                    : "bg-[#f5f0e8]/5"
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] text-[#c9a96e]/60 font-mono">
            {selectedDynasty.errorLevel}/5
          </span>
        </div>
      </div>
    </div>
  );
}
