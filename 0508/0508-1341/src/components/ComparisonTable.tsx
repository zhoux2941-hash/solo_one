import { Ruler, FlaskConical, Scale } from 'lucide-react'
import type { DynastyName, UnitCategory, AncientUnit } from '@/types'
import { DYNASTY_ORDER, UNIT_LABELS } from '@/types'
import { dynastyMeasures } from '@/data/dynastyUnits'
import { getUnitModernValue } from '@/hooks/useConversion'
import { cn } from '@/lib/utils'

const CATEGORY_TABS: { key: UnitCategory; label: string; Icon: typeof Ruler }[] = [
  { key: 'length', label: '长度', Icon: Ruler },
  { key: 'capacity', label: '容量', Icon: FlaskConical },
  { key: 'weight', label: '重量', Icon: Scale },
]

function buildColumns(category: UnitCategory): { label: string; unit: AncientUnit }[] {
  const modernUnit = UNIT_LABELS[category].modernUnit
  return UNIT_LABELS[category].units.map(unit => ({
    label: `1${unit}(${modernUnit})`,
    unit,
  }))
}

interface ComparisonTableProps {
  category: UnitCategory
  selectedDynasty: DynastyName
  onCategoryChange?: (category: UnitCategory) => void
}

export default function ComparisonTable({ category, selectedDynasty, onCategoryChange }: ComparisonTableProps) {
  const columns = buildColumns(category)

  return (
    <div className="parchment-card p-4">
      <div className="flex gap-1 mb-4">
        {CATEGORY_TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => onCategoryChange?.(key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-md font-body text-sm transition-colors',
              category === key
                ? 'text-cinnabar bg-cinnabar/10'
                : 'text-parchment/40 hover:text-parchment/70 hover:bg-parchment/5'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full font-body text-sm">
          <thead>
            <tr className="border-b border-parchment/10">
              <th className="text-left py-2.5 px-3 text-parchment/50 font-medium">朝代</th>
              {columns.map((col) => (
                <th key={col.label} className="text-right py-2.5 px-3 text-parchment/50 font-medium">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dynastyMeasures.map((data) => {
              const isSelected = data.dynasty === selectedDynasty
              return (
                <tr
                  key={data.dynasty}
                  className={cn(
                    'border-b border-parchment/5 border-l-4 transition-colors',
                    isSelected
                      ? 'border-l-cinnabar bg-cinnabar/10'
                      : 'border-l-transparent hover:bg-parchment/5'
                  )}
                >
                  <td className="py-2.5 px-3 text-parchment font-medium">
                    {data.dynasty}
                  </td>
                  {columns.map((col) => {
                    const val = getUnitModernValue(data.dynasty, col.unit)
                    return (
                      <td key={col.label} className="text-right py-2.5 px-3 text-parchment/80 tabular-nums">
                        {val > 0 ? val : '—'}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
