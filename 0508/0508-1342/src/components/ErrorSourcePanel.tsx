import { useMapStore } from '@/store/useMapStore';
import { Maximize2, Compass, BookOpen } from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  Maximize2: <Maximize2 size={18} />,
  Compass: <Compass size={18} />,
  BookOpen: <BookOpen size={18} />,
};

function SeverityBar({ severity }: { severity: number }) {
  const width = severity * 100;
  const color = severity >= 0.7 ? "#c23616" : severity >= 0.4 ? "#e67e22" : "#f1c40f";

  return (
    <div className="h-1 bg-[#f5f0e8]/10 rounded-full overflow-hidden mt-2">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${width}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function ErrorSourcePanel() {
  const { selectedDynasty } = useMapStore();

  return (
    <div className="space-y-3">
      <h3
        className="text-sm font-bold text-[#c9a96e] tracking-wider mb-3"
        style={{ fontFamily: "'Noto Serif SC', serif" }}
      >
        误差来源分析
      </h3>
      {selectedDynasty.errorSources.map((source) => (
        <div
          key={source.type}
          className="bg-[#1a1a2e]/80 border border-[#c9a96e]/10 rounded-lg p-3.5 hover:border-[#c9a96e]/25 transition-all duration-300 group"
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="text-[#c9a96e]/70 group-hover:text-[#c9a96e] transition-colors">
              {ICON_MAP[source.icon]}
            </div>
            <span
              className="text-[#f5f0e8]/90 font-medium text-sm"
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
              {source.title}
            </span>
            <span className="ml-auto text-[10px] text-[#f5f0e8]/30">
              {Math.round(source.severity * 100)}%
            </span>
          </div>
          <p className="text-[11px] text-[#f5f0e8]/50 leading-relaxed pl-7">
            {source.description}
          </p>
          <SeverityBar severity={source.severity} />
        </div>
      ))}
    </div>
  );
}
