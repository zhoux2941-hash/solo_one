import { dynasties } from '@/data/dynasties'
import { useAppStore } from '@/store/useAppStore'

export default function TimelineBar() {
  const selectedDynasty = useAppStore(s => s.selectedDynasty)
  const setSelectedDynasty = useAppStore(s => s.setSelectedDynasty)

  return (
    <div className="relative w-full py-8">
      <div className="flex items-center justify-center gap-0 relative">
        <div className="absolute top-1/2 left-[8%] right-[8%] h-[2px] bg-gradient-to-r from-amber-900/20 via-amber-800/40 to-amber-900/20 -translate-y-1/2" />

        {dynasties.map((dynasty, idx) => {
          const isSelected = selectedDynasty === dynasty.id
          return (
            <div
              key={dynasty.id}
              className="flex flex-col items-center relative z-10 group"
              style={{ flex: 1 }}
            >
              <button
                onClick={() => setSelectedDynasty(dynasty.id)}
                className={`
                  relative flex flex-col items-center gap-2 transition-all duration-500
                  ${isSelected ? 'scale-110' : 'hover:scale-105'}
                `}
              >
                <div
                  className={`
                    w-14 h-14 rounded-full flex items-center justify-center
                    border-2 transition-all duration-500
                    font-serif text-xl font-bold
                    ${isSelected
                      ? 'border-red-700 bg-red-800/90 text-amber-100 shadow-lg shadow-red-800/50'
                      : 'border-amber-800/60 bg-amber-950/80 text-amber-200 hover:border-red-700/60'
                    }
                  `}
                >
                  {dynasty.name}
                </div>

                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full animate-pulse" />
                )}

                <span
                  className={`
                    text-xs font-serif whitespace-nowrap transition-colors duration-300
                    ${isSelected ? 'text-red-700 font-semibold' : 'text-amber-700/80'}
                  `}
                >
                  {dynasty.period}
                </span>

                <span className="text-[10px] text-amber-800/50 font-mono">
                  {dynasty.yearRange[0] > 0
                    ? `${dynasty.yearRange[0]}-${dynasty.yearRange[1]}`
                    : `${Math.abs(dynasty.yearRange[0])}BC-${dynasty.yearRange[1]}`
                  }
                </span>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
