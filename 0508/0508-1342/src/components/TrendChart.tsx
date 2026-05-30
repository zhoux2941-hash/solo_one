import { ERROR_TRENDS } from '@/data/dynastyData';
import { useMapStore } from '@/store/useMapStore';

const CATEGORY_COLORS = {
  scale: "#e67e22",
  direction: "#457b9d",
  mythology: "#6a4c93",
};

export default function TrendChart() {
  const { selectedDynasty } = useMapStore();
  const maxValue = 1;

  return (
    <div className="space-y-3">
      <h3
        className="text-sm font-bold text-[#c9a96e] tracking-wider"
        style={{ fontFamily: "'Noto Serif SC', serif" }}
      >
        误差趋势演变
      </h3>

      <div className="bg-[#1a1a2e]/80 border border-[#c9a96e]/10 rounded-lg p-4">
        <div className="flex items-end gap-3 h-32 mb-3">
          {ERROR_TRENDS.map((trend, i) => {
            const isActive = trend.dynastyId === selectedDynasty.id;
            return (
              <div key={trend.dynastyId} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-0.5 items-end h-24">
                  <div
                    className="flex-1 rounded-t transition-all duration-500"
                    style={{
                      height: `${(trend.scaleError / maxValue) * 100}%`,
                      backgroundColor: isActive ? CATEGORY_COLORS.scale : `${CATEGORY_COLORS.scale}40`,
                      opacity: isActive ? 1 : 0.5,
                    }}
                  />
                  <div
                    className="flex-1 rounded-t transition-all duration-500"
                    style={{
                      height: `${(trend.directionError / maxValue) * 100}%`,
                      backgroundColor: isActive ? CATEGORY_COLORS.direction : `${CATEGORY_COLORS.direction}40`,
                      opacity: isActive ? 1 : 0.5,
                    }}
                  />
                  <div
                    className="flex-1 rounded-t transition-all duration-500"
                    style={{
                      height: `${(trend.mythologyError / maxValue) * 100}%`,
                      backgroundColor: isActive ? CATEGORY_COLORS.mythology : `${CATEGORY_COLORS.mythology}40`,
                      opacity: isActive ? 1 : 0.5,
                    }}
                  />
                </div>
                <span
                  className={`text-xs transition-all duration-300 ${
                    isActive ? "text-[#c9a96e] font-bold" : "text-[#f5f0e8]/30"
                  }`}
                  style={{ fontFamily: "'Noto Serif SC', serif" }}
                >
                  {trend.dynastyName}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-4 pt-2 border-t border-[#c9a96e]/10">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: CATEGORY_COLORS.scale }} />
            <span className="text-[10px] text-[#f5f0e8]/40">比例尺</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: CATEGORY_COLORS.direction }} />
            <span className="text-[10px] text-[#f5f0e8]/40">方向</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: CATEGORY_COLORS.mythology }} />
            <span className="text-[10px] text-[#f5f0e8]/40">山海经</span>
          </div>
        </div>
      </div>

      <div className="bg-[#1a1a2e]/80 border border-[#c9a96e]/10 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#f5f0e8]/40">综合误差指数</span>
          <div className="flex items-center gap-2">
            {ERROR_TRENDS.map((trend) => {
              const isActive = trend.dynastyId === selectedDynasty.id;
              return (
                <div
                  key={trend.dynastyId}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all duration-300 ${
                    isActive ? "bg-[#c9a96e]/15 border border-[#c9a96e]/30" : ""
                  }`}
                >
                  <span
                    className={`text-[10px] ${isActive ? "text-[#c9a96e]" : "text-[#f5f0e8]/25"}`}
                    style={{ fontFamily: "'Noto Serif SC', serif" }}
                  >
                    {trend.dynastyName}
                  </span>
                  <span className={`text-xs font-bold ${isActive ? "text-[#c9a96e]" : "text-[#f5f0e8]/20"}`}>
                    {trend.overallError.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-2 h-1.5 bg-[#f5f0e8]/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${(selectedDynasty.errorLevel / 3) * 100}%`,
              background: `linear-gradient(90deg, #2d6a4f, #e67e22, #c23616)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
