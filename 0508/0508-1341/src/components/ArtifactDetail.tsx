import { useState } from 'react'
import { Star } from 'lucide-react'
import type { Artifact, DynastyName } from '@/types'
import { DYNASTY_ORDER } from '@/types'
import { cmToAncient } from '@/hooks/useConversion'
import { useFavorites } from '@/hooks/useFavorites'
import { cn } from '@/lib/utils'

interface ArtifactDetailProps {
  artifact: Artifact
}

function formatNum(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString('zh-CN')
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

function calculateDynastyValues(
  dimensions: { label: string; value: number; unit: string }[],
  dynasties: DynastyName[]
) {
  return dynasties.map((dynasty: DynastyName) => {
    const dimValues = dimensions.map(dim => {
      const chiValue = cmToAncient(dim.value, dynasty)
      return { label: dim.label, chiValue, unit: dim.unit }
    })
    return { dynasty, dimensions: dimValues }
  })
}

export default function ArtifactDetail({ artifact }: ArtifactDetailProps) {
  const addFavorite = useFavorites(s => s.addFavorite)

  const [adjustedDimensions, setAdjustedDimensions] = useState<{ [label: string]: number }>(() => {
    const initial: { [label: string]: number } = {}
    artifact.dimensions.forEach(dim => {
      initial[dim.label] = (dim.min + dim.max) / 2
    })
    return initial
  })

  const dimensionList = artifact.dimensions.map(dim => ({
    label: dim.label,
    value: adjustedDimensions[dim.label],
    unit: dim.unit,
  }))

  const dynastyCalculations = calculateDynastyValues(dimensionList, DYNASTY_ORDER)

  function handleDimensionChange(label: string, value: number) {
    const dim = artifact.dimensions.find(d => d.label === label)
    if (!dim) return
    const clamped = Math.min(Math.max(value, dim.min), dim.max)
    setAdjustedDimensions(prev => ({ ...prev, [label]: clamped }))
  }

  function handleSliderChange(label: string, e: React.ChangeEvent<HTMLInputElement>) {
    handleDimensionChange(label, Number(e.target.value))
  }

  function handleNumberChange(label: string, e: React.ChangeEvent<HTMLInputElement>) {
    handleDimensionChange(label, Number(e.target.value))
  }

  function handleFavorite() {
    const estimation = {
      artifactId: artifact.id,
      artifactName: artifact.name,
      adjustedDimensions: dimensionList,
      dynastyValues: dynastyCalculations.map(({ dynasty, dimensions }) => ({
        dynasty,
        dimensions: dimensions.map(d => ({
          label: d.label,
          chiValue: d.chiValue,
          unit: d.unit,
        })),
      })),
    }
    addFavorite({ type: 'artifact', data: estimation })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="parchment-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-title text-4xl text-parchment tracking-wider mb-2">
              {artifact.name}
            </h2>
            <div className="flex items-center gap-4 font-body text-parchment/60">
              <span className="px-3 py-1 bg-bronze/20 text-bronze-light rounded-md text-sm">
                {artifact.dynasty}
              </span>
              <span className="px-3 py-1 bg-cinnabar/10 text-cinnabar rounded-md text-sm">
                {artifact.category}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="parchment-card p-6">
        <h3 className="font-title text-2xl text-parchment tracking-wider mb-6">
          尺寸调整
        </h3>
        <div className="space-y-8">
          {artifact.dimensions.map(dim => {
            const currentValue = adjustedDimensions[dim.label]
            return (
              <div key={dim.label} className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-body text-lg text-parchment/80">
                    {dim.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={currentValue}
                      onChange={e => handleNumberChange(dim.label, e)}
                      min={dim.min}
                      max={dim.max}
                      step={0.1}
                      className="input-field w-24 text-center font-title text-xl tabular-nums"
                    />
                    <span className="font-body text-parchment/60 text-sm">{dim.unit}</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={dim.min}
                  max={dim.max}
                  step={0.1}
                  value={currentValue}
                  onChange={e => handleSliderChange(dim.label, e)}
                  className="w-full"
                />
                <div className="flex justify-between font-body text-xs text-parchment/40">
                  <span>{dim.min} {dim.unit}</span>
                  <span>{dim.max} {dim.unit}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="parchment-card p-6">
        <h3 className="font-title text-2xl text-parchment tracking-wider mb-6">
          各朝代换算
        </h3>
        <div className="space-y-6">
          {artifact.dimensions.map(dim => {
            const currentValue = adjustedDimensions[dim.label]
            return (
              <div key={dim.label} className="space-y-3">
                <div className="font-body text-parchment/70">
                  {dim.label}: <span className="font-title text-xl text-cinnabar">{formatNum(currentValue)}{dim.unit}</span>
                </div>
                <div className={cn('parchment-card-solid p-4')}>
                  <div className={cn('flex flex-wrap gap-x-4 gap-y-2 font-body')}>
                    {dynastyCalculations.map(({ dynasty, dimensions }) => {
                      const dimValue = dimensions.find(d => d.label === dim.label)
                      return (
                        <span
                          key={dynasty}
                          className={cn('flex items-center gap-1')}
                        >
                          <span className="text-bronze-light">{dynasty}</span>
                          <span className="text-parchment font-title">
                            {formatNum(dimValue?.chiValue || 0)}尺
                          </span>
                          {dynasty !== DYNASTY_ORDER[DYNASTY_ORDER.length - 1] && (
                            <span className="text-parchment/30">·</span>
                          )}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleFavorite}
          className="cinnabar-btn flex items-center gap-2"
        >
          <Star className="w-4 h-4" />
          收藏此估算
        </button>
      </div>
    </div>
  )
}
