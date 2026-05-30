import { DYNASTIES } from '@/data/dynastyData';
import { useMapStore } from '@/store/useMapStore';

const DYNASTY_PERIODS: Record<string, string> = {
  tang: "618–907",
  song: "960–1279",
  yuan: "1271–1368",
  ming: "1368–1644",
};

export default function DynastySelector() {
  const { selectedDynasty, selectDynasty, isTransitioning } = useMapStore();

  return (
    <div className="flex items-center gap-1">
      {DYNASTIES.map((dynasty) => {
        const isActive = selectedDynasty.id === dynasty.id;
        return (
          <button
            key={dynasty.id}
            onClick={() => !isTransitioning && selectDynasty(dynasty.id)}
            disabled={isTransitioning}
            className={`
              relative px-5 py-2.5 rounded-md transition-all duration-300 group
              ${isActive
                ? "bg-[#c9a96e]/15 border border-[#c9a96e]/50 shadow-[0_0_20px_rgba(201,169,110,0.15)]"
                : "bg-transparent border border-transparent hover:border-[#c9a96e]/20 hover:bg-[#c9a96e]/5"
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <span
              className={`
                text-lg font-bold tracking-wider transition-all duration-300
                ${isActive ? "text-[#c9a96e]" : "text-[#f5f0e8]/40 group-hover:text-[#f5f0e8]/70"}
              `}
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
              {dynasty.name}
            </span>
            <span
              className={`
                ml-2 text-xs transition-all duration-300
                ${isActive ? "text-[#c9a96e]/70" : "text-[#f5f0e8]/20 group-hover:text-[#f5f0e8]/40"}
              `}
            >
              {DYNASTY_PERIODS[dynasty.id]}
            </span>
            {isActive && (
              <div
                className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#c9a96e]/60 rounded-full"
                style={{ animation: "slideIn 0.3s ease" }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
