import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { DynastyName } from '@/types'
import { DYNASTY_ORDER, DYNASTY_PERIODS } from '@/types'

interface DynastyTimelineProps {
  selectedDynasty: DynastyName
  onSelectDynasty: (dynasty: DynastyName) => void
}

export default function DynastyTimeline({ selectedDynasty, onSelectDynasty }: DynastyTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef<Record<DynastyName, HTMLButtonElement | null>>(
    {} as Record<DynastyName, HTMLButtonElement | null>
  )

  useEffect(() => {
    const node = nodeRefs.current[selectedDynasty]
    if (node && scrollRef.current) {
      node.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [selectedDynasty])

  return (
    <div className="relative w-full overflow-hidden">
      <div
        ref={scrollRef}
        className="flex items-center gap-0 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 px-8 scrollbar-thin"
      >
        <div className="relative flex items-center min-w-max py-8">
          <div className="absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 bg-bronze/50" />

          {DYNASTY_ORDER.map((dynasty, index) => {
            const isSelected = dynasty === selectedDynasty

            return (
              <button
                key={dynasty}
                ref={(el) => { nodeRefs.current[dynasty] = el }}
                onClick={() => onSelectDynasty(dynasty)}
                className={cn(
                  'relative flex flex-col items-center snap-center outline-none',
                  'px-6 transition-transform duration-200 active:scale-95',
                  'cursor-pointer'
                )}
              >
                <div
                  className={cn(
                    'relative z-10 w-5 h-5 rounded-full border-2 transition-all duration-300',
                    isSelected
                      ? 'bg-cinnabar border-cinnabar shadow-[0_0_12px_3px_rgba(194,54,22,0.5)]'
                      : 'bg-bronze border-bronze-light hover:bg-bronze-light hover:border-bronze-light hover:shadow-[0_0_8px_2px_rgba(45,106,79,0.3)]'
                  )}
                />

                {index < DYNASTY_ORDER.length - 1 && (
                  <div
                    className={cn(
                      'absolute top-1/2 -translate-y-1/2 h-[2px] z-0 transition-colors duration-300',
                      isSelected ? 'bg-cinnabar/60' : 'bg-bronze/30'
                    )}
                    style={{ left: 'calc(50% + 10px)', width: 'calc(100% - 20px)' }}
                  />
                )}

                <span
                  className={cn(
                    'mt-3 text-lg tracking-widest transition-colors duration-300 font-title',
                    isSelected ? 'text-cinnabar' : 'text-parchment/70 hover:text-parchment'
                  )}
                >
                  {dynasty}
                </span>

                <span
                  className={cn(
                    'mt-1 text-xs whitespace-nowrap transition-colors duration-300 font-body',
                    isSelected ? 'text-cinnabar-light' : 'text-parchment/40'
                  )}
                >
                  {DYNASTY_PERIODS[dynasty]}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
