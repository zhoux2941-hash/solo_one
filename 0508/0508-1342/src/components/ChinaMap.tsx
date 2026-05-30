import { MODERN_CHINA_PATH, type HeatPoint } from '@/data/dynastyData';
import { useMapStore } from '@/store/useMapStore';

const GRID_LINES = [
  "M0,100 L700,100", "M0,200 L700,200", "M0,300 L700,300",
  "M0,400 L700,400", "M0,500 L700,500",
  "M100,0 L100,600", "M200,0 L200,600", "M300,0 L300,600",
  "M400,0 L400,600", "M500,0 L500,600", "M600,0 L600,600",
];

const RIVER_PATHS = [
  "M155,100 L170,115 L185,130 L200,140 L220,155 L240,165 L260,172 L280,178 L300,182 L320,185 L340,192 L355,200 L370,215 L385,230 L400,248 L410,265 L420,280 L430,295 L440,310 L450,325 L460,340 L468,355 L475,370",
  "M250,185 L270,195 L290,210 L310,225 L330,240 L350,255 L370,268 L390,278 L410,288 L430,295 L450,305 L465,315 L480,328 L495,340 L510,352 L525,365 L540,378"
];

function getHeatColor(intensity: number): { stop0: string; stop05: string; stop1: string } {
  if (intensity >= 0.8) {
    return {
      stop0: "rgba(194, 54, 22, 0.7)",
      stop05: "rgba(194, 54, 22, 0.3)",
      stop1: "rgba(194, 54, 22, 0)",
    };
  }
  if (intensity >= 0.6) {
    return {
      stop0: "rgba(230, 126, 34, 0.6)",
      stop05: "rgba(230, 126, 34, 0.25)",
      stop1: "rgba(230, 126, 34, 0)",
    };
  }
  if (intensity >= 0.4) {
    return {
      stop0: "rgba(241, 196, 15, 0.5)",
      stop05: "rgba(241, 196, 15, 0.2)",
      stop1: "rgba(241, 196, 15, 0)",
    };
  }
  return {
    stop0: "rgba(241, 196, 15, 0.3)",
    stop05: "rgba(241, 196, 15, 0.1)",
    stop1: "rgba(241, 196, 15, 0)",
  };
}

function generateHeatGradients(points: HeatPoint[], dynastyId: string): React.ReactNode[] {
  return points
    .slice()
    .sort((a, b) => a.intensity - b.intensity)
    .map((point, i) => {
      const colors = getHeatColor(point.intensity);
      return (
        <radialGradient
          key={`grad-${dynastyId}-${i}`}
          id={`heat-${dynastyId}-${i}`}
          cx="50%"
          cy="50%"
          r="50%"
        >
          <stop offset="0%" stopColor={colors.stop0} />
          <stop offset="50%" stopColor={colors.stop05} />
          <stop offset="100%" stopColor={colors.stop1} />
        </radialGradient>
      );
    });
}

function renderHeatPoints(points: HeatPoint[], dynastyId: string): React.ReactNode[] {
  return points
    .slice()
    .sort((a, b) => a.intensity - b.intensity)
    .map((point, i) => {
      const pulseDelay = i * 0.15;
      const shouldPulse = point.intensity >= 0.7;
      return (
        <circle
          key={`heat-circle-${dynastyId}-${i}`}
          cx={point.cx}
          cy={point.cy}
          r={point.radius}
          fill={`url(#heat-${dynastyId}-${i})`}
          style={{
            mixBlendMode: "screen",
            animation: shouldPulse ? `heat-pulse 3s ease-in-out ${pulseDelay}s infinite` : "none",
          }}
        />
      );
    });
}

export default function ChinaMap() {
  const { selectedDynasty, isTransitioning, showErrorLayer } = useMapStore();

  const sortedHeatPoints = selectedDynasty.heatPoints
    .slice()
    .sort((a, b) => a.intensity - b.intensity);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        viewBox="0 0 700 560"
        className="w-full h-full max-h-[calc(100vh-120px)]"
        style={{ filter: isTransitioning ? "blur(2px) opacity(0.5)" : "none", transition: "filter 0.3s ease" }}
      >
        <defs>
          <radialGradient id="bgGrad" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#1a1a2e" />
            <stop offset="100%" stopColor="#0f0f1a" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="heatBlur">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern id="gridPattern" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(201, 169, 110, 0.06)" strokeWidth="0.5" />
          </pattern>
          <linearGradient id="heatLegend" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(241, 196, 15, 0.1)" />
            <stop offset="30%" stopColor="rgba(241, 196, 15, 0.5)" />
            <stop offset="60%" stopColor="rgba(230, 126, 34, 0.6)" />
            <stop offset="100%" stopColor="rgba(194, 54, 22, 0.7)" />
          </linearGradient>
          {generateHeatGradients(sortedHeatPoints, selectedDynasty.id)}
        </defs>

        <rect width="700" height="560" fill="url(#bgGrad)" />
        <rect width="700" height="560" fill="url(#gridPattern)" />

        {GRID_LINES.map((line, i) => (
          <path key={i} d={line} fill="none" stroke="rgba(201, 169, 110, 0.04)" strokeWidth="0.3" />
        ))}

        <path
          d={MODERN_CHINA_PATH}
          fill="rgba(245, 240, 232, 0.06)"
          stroke="rgba(201, 169, 110, 0.5)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {RIVER_PATHS.map((path, i) => (
          <path
            key={i}
            d={path}
            fill="none"
            stroke="rgba(69, 123, 157, 0.35)"
            strokeWidth="1"
            strokeLinecap="round"
            strokeDasharray="4 3"
          />
        ))}

        <g
          style={{
            transition: "opacity 0.4s ease",
            opacity: isTransitioning ? 0 : 1,
          }}
        >
          <path
            d={selectedDynasty.territoryPath}
            fill={`${selectedDynasty.color}33`}
            stroke={selectedDynasty.colorLight}
            strokeWidth="1.2"
            strokeLinejoin="round"
            strokeDasharray="8 4"
            filter="url(#glow)"
            style={{ transition: "all 0.4s ease" }}
          />

          {showErrorLayer && (
            <g filter="url(#heatBlur)">
              {renderHeatPoints(sortedHeatPoints, selectedDynasty.id)}
            </g>
          )}
        </g>

        <text x="355" y="548" textAnchor="middle" fill="rgba(201, 169, 110, 0.3)" fontSize="9" fontFamily="'Noto Serif SC', serif">
          {selectedDynasty.name}代疆域认知 · 误差热力图
        </text>
      </svg>

      <div className="absolute bottom-4 left-4 bg-[#1a1a2e]/90 backdrop-blur-sm border border-[#c9a96e]/20 rounded-lg px-4 py-3">
        <div className="text-[10px] text-[#c9a96e]/60 mb-2 tracking-wider">图例</div>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-[10px] text-[#f5f0e8]/50 mb-1">
              <span>轻微偏差</span>
              <span>严重误差</span>
            </div>
            <div className="w-28 h-2 rounded-full" style={{ background: 'linear-gradient(90deg, rgba(241, 196, 15, 0.3), rgba(230, 126, 34, 0.5), rgba(194, 54, 22, 0.65))' }} />
            <div className="flex justify-between text-[9px] text-[#f5f0e8]/25 mt-0.5">
              <span>0.2</span>
              <span>0.5</span>
              <span>0.8+</span>
            </div>
          </div>
          <div className="pt-2 border-t border-[#c9a96e]/10 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm border border-dashed border-[#2d6a9f]" style={{ background: 'rgba(29,53,87,0.2)' }} />
              <span className="text-[10px] text-[#f5f0e8]/70">朝代疆域</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm border border-[#c9a96e]/50" style={{ background: 'rgba(245,240,232,0.06)' }} />
              <span className="text-[10px] text-[#f5f0e8]/70">现代疆域</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
