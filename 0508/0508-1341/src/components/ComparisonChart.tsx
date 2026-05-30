import { useState, useEffect, useMemo } from 'react'
import { dynastyMeasures } from '@/data/dynastyUnits'
import type { UnitCategory, DynastyName } from '@/types'
import { DYNASTY_ORDER, UNIT_LABELS } from '@/types'
import { cn } from '@/lib/utils'

interface ComparisonChartProps {
  category: UnitCategory
  selectedDynasty: DynastyName
}

const CATEGORY_TITLE: Record<UnitCategory, string> = {
  length: '长度',
  capacity: '容量',
  weight: '重量',
}

export default function ComparisonChart({ category, selectedDynasty }: ComparisonChartProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const { baseUnit, modernUnit } = UNIT_LABELS[category]
  const title = `历代1${baseUnit}${CATEGORY_TITLE[category]}对比 (${modernUnit})`

  const chartData = useMemo(() => {
    return DYNASTY_ORDER.map(dynasty => {
      const data = dynastyMeasures.find(d => d.dynasty === dynasty)!
      let value: number
      if (category === 'length') value = data.chiToCm
      else if (category === 'capacity') value = data.shengToMl
      else value = data.jinToG
      return { dynasty, value }
    })
  }, [category])

  const maxValue = useMemo(() => {
    return Math.max(...chartData.map(d => d.value))
  }, [chartData])

  return (
    <div className="parchment-card p-6">
      <h3 className="font-title text-2xl text-parchment tracking-wider mb-6 text-center">
        {title}
      </h3>
      <div className="space-y-4">
        {chartData.map(({ dynasty, value }) => {
          const isSelected = dynasty === selectedDynasty
          const percentage = (value / maxValue) * 100

          return (
            <div key={dynasty} className="flex items-center gap-3">
              <div className="w-8 text-right font-body text-sm text-parchment/80 shrink-0">
                {dynasty}
              </div>
              <div className="flex-1 h-8 bg-parchment/5 rounded-md overflow-hidden relative">
                <div
                  className={cn(
                    'h-full rounded-md transition-all duration-700 ease-out',
                    isSelected
                      ? 'bg-cinnabar'
                      : 'bg-gradient-to-r from-bronze to-bronze-light'
                  )}
                  style={{
                    width: mounted ? `${percentage}%` : '0%',
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-end px-3">
                  <span className={cn(
                    'font-body text-sm tabular-nums',
                    isSelected ? 'text-parchment' : 'text-parchment/90'
                  )}>
                    {value.toLocaleString('zh-CN', { maximumFractionDigits: 1 })}{modernUnit}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
