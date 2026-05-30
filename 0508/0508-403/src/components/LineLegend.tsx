import { useAppStore } from '@/store/useAppStore'
import { lines } from '@/data/railwayConfig'

export default function LineLegend() {
  const highlightedLineId = useAppStore((s) => s.highlightedLineId)
  const highlightLine = useAppStore((s) => s.highlightLine)

  return (
    <div className="absolute bottom-20 left-3 z-10 flex flex-col gap-0.5 rounded-lg bg-slate-900/80 p-2 backdrop-blur">
      {lines.map((line) => {
        const isHighlighted = highlightedLineId === line.id

        return (
          <button
            key={line.id}
            onClick={() => highlightLine(line.id)}
            className={`flex items-center gap-2 rounded px-2 py-1 text-sm text-white transition-all hover:bg-white/10 ${
              isHighlighted
                ? 'ring-2 ring-white/60 shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                : ''
            }`}
          >
            <span
              className="inline-block h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: line.color }}
            />
            <span>{line.name}</span>
          </button>
        )
      })}
    </div>
  )
}
