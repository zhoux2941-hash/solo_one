import { useState, useMemo } from 'react'
import { Ruler, FlaskConical, Scale, Star } from 'lucide-react'
import { convertUnit } from '@/hooks/useConversion'
import { useFavorites } from '@/hooks/useFavorites'
import type { DynastyName, AncientUnit, UnitCategory } from '@/types'
import { UNIT_LABELS, DYNASTY_ORDER, getCategoryForUnit } from '@/types'
import { dynastyMeasures } from '@/data/dynastyUnits'
import { cn } from '@/lib/utils'

const CATEGORY_TABS: { key: UnitCategory; label: string; Icon: typeof Ruler }[] = [
  { key: 'length', label: '长度', Icon: Ruler },
  { key: 'capacity', label: '容量', Icon: FlaskConical },
  { key: 'weight', label: '重量', Icon: Scale },
]

const ALL_UNITS: AncientUnit[] = ['丈', '尺', '寸', '斛', '斗', '升', '斤', '两', '铢']

function formatNum(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString('zh-CN')
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

export default function UnitConverter() {
  const [value, setValue] = useState<number>(10)
  const [unit, setUnit] = useState<AncientUnit>('尺')
  const [sourceDynasty, setSourceDynasty] = useState<DynastyName>('汉')
  const [targetDynasties, setTargetDynasties] = useState<DynastyName[]>(
    DYNASTY_ORDER.filter(d => d !== '汉')
  )

  const addFavorite = useFavorites(s => s.addFavorite)
  const category = useMemo(() => getCategoryForUnit(unit), [unit])
  const safeValue = isNaN(value) ? 0 : value
  const result = useMemo(
    () => convertUnit(safeValue, unit, sourceDynasty, targetDynasties),
    [safeValue, unit, sourceDynasty, targetDynasties]
  )

  function handleCategoryChange(cat: UnitCategory) {
    setUnit(UNIT_LABELS[cat].units[0])
  }

  function handleSourceDynastyChange(newDynasty: DynastyName) {
    const oldDynasty = sourceDynasty
    setSourceDynasty(newDynasty)
    setTargetDynasties(prev => {
      const next = prev.filter(d => d !== newDynasty)
      if (!next.includes(oldDynasty)) next.push(oldDynasty)
      return next
    })
  }

  function handleTargetToggle(dynasty: DynastyName) {
    setTargetDynasties(prev =>
      prev.includes(dynasty) ? prev.filter(d => d !== dynasty) : [...prev, dynasty]
    )
  }

  function handleFavorite() {
    addFavorite({ type: 'conversion', data: result })
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-1">
        {CATEGORY_TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => handleCategoryChange(key)}
            className={cn(
              'flex items-center gap-1.5 px-5 py-2.5 rounded-md font-body text-sm transition-colors',
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

      <div className="parchment-card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="number"
            value={value}
            onChange={e => setValue(Number(e.target.value))}
            className="input-field text-3xl font-title w-40 text-center tabular-nums"
          />
          <select
            value={unit}
            onChange={e => setUnit(e.target.value as AncientUnit)}
            className="select-field text-lg"
          >
            {ALL_UNITS.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
          <select
            value={sourceDynasty}
            onChange={e => handleSourceDynastyChange(e.target.value as DynastyName)}
            className="select-field text-lg"
          >
            {DYNASTY_ORDER.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="parchment-card p-4">
        <div className="text-parchment/50 text-sm font-body mb-3">目标朝代</div>
        <div className="flex flex-wrap gap-3">
          {DYNASTY_ORDER.filter(d => d !== sourceDynasty).map(dynasty => (
            <label
              key={dynasty}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors text-sm font-body',
                targetDynasties.includes(dynasty)
                  ? 'bg-cinnabar/15 text-cinnabar border border-cinnabar/30'
                  : 'text-parchment/40 border border-parchment/10 hover:border-parchment/20'
              )}
            >
              <input
                type="checkbox"
                checked={targetDynasties.includes(dynasty)}
                onChange={() => handleTargetToggle(dynasty)}
                className="hidden"
              />
              {dynasty}
            </label>
          ))}
        </div>
      </div>

      <div className="parchment-card p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="font-title text-4xl text-parchment tracking-wider">
            {sourceDynasty} {safeValue}{unit} = {formatNum(result.modernValue)}{result.modernUnit}
          </div>
          <button onClick={handleFavorite} className="cinnabar-btn flex items-center gap-2 shrink-0">
            <Star className="w-4 h-4" />
            收藏
          </button>
        </div>

        <div className="cloud-divider" />

        {result.targets.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {result.targets.map(target => {
              const dynastyData = dynastyMeasures.find(d => d.dynasty === target.dynasty)
              return (
                <div
                  key={target.dynasty}
                  className="parchment-card p-4 text-center hover:bg-parchment/5 transition-colors"
                >
                  <div className="text-parchment/60 text-xs font-body mb-0.5">{target.dynasty}</div>
                  <div className="text-parchment/30 text-[10px] font-body mb-2">{dynastyData?.period}</div>
                  <div className="font-title text-2xl text-cinnabar">
                    {target.value}
                    <span className="text-lg text-parchment/70">{target.unit}</span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center text-parchment/40 font-body py-8">
            请选择至少一个目标朝代
          </div>
        )}
      </div>
    </div>
  )
}
