import { cn } from '@/lib/utils'
import type { Artifact } from '@/types'
import { artifacts } from '@/data/artifacts'

interface ArtifactSelectorProps {
  selectedId: string | null
  onSelect: (artifact: Artifact) => void
}

function formatDimensions(artifact: Artifact): string {
  return artifact.dimensions
    .map((d) => `${d.label} ${d.min}-${d.max}${d.unit}`)
    .join(' · ')
}

export default function ArtifactSelector({ selectedId, onSelect }: ArtifactSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {artifacts.map((artifact) => {
        const isSelected = artifact.id === selectedId

        return (
          <button
            key={artifact.id}
            onClick={() => onSelect(artifact)}
            className={cn(
              'parchment-card-solid text-left p-5 transition-all duration-300 cursor-pointer',
              'hover:-translate-y-1 hover:shadow-lg hover:shadow-ink/30',
              isSelected && 'border-2 border-cinnabar shadow-[0_0_16px_4px_rgba(194,54,22,0.2)]'
            )}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-title text-xl text-ink">{artifact.name}</h3>
              <span className="font-body text-xs px-2 py-0.5 rounded bg-bronze/20 text-bronze whitespace-nowrap">
                {artifact.category}
              </span>
            </div>

            <p className="font-body text-sm text-ink/60 mb-1">{artifact.dynasty}</p>

            <p className="font-body text-xs text-ink/50">{formatDimensions(artifact)}</p>
          </button>
        )
      })}
    </div>
  )
}
