import { useEffect } from 'react'
import { officials, categories } from '@/data/officials'
import { useAppStore } from '@/store/useAppStore'
import type { SelectorMode } from '@/types'

const rankOptions = [
  { value: 1, label: '一品' },
  { value: 2, label: '二品' },
  { value: 3, label: '三品' },
  { value: 4, label: '四品' },
  { value: 5, label: '五品' },
  { value: 6, label: '六品' },
  { value: 7, label: '七品' },
  { value: 8, label: '八品' },
  { value: 9, label: '九品' },
]

export default function OfficialSelector() {
  const selectorMode = useAppStore(s => s.selectorMode)
  const selectedOfficial = useAppStore(s => s.selectedOfficial)
  const selectedRank = useAppStore(s => s.selectedRank)
  const setSelectorMode = useAppStore(s => s.setSelectorMode)
  const setSelectedOfficial = useAppStore(s => s.setSelectedOfficial)
  const setSelectedRank = useAppStore(s => s.setSelectedRank)
  const selectedDynasty = useAppStore(s => s.selectedDynasty)

  const filteredByRank = officials.filter(o => {
    const rankInfo = o.ranksByDynasty[selectedDynasty]
    return rankInfo?.rank === selectedRank
  })

  useEffect(() => {
    if (selectorMode === 'rank' && filteredByRank.length > 0) {
      const alreadySelected = filteredByRank.find(o => o.id === selectedOfficial)
      if (!alreadySelected) {
        setSelectedOfficial(filteredByRank[0].id)
      }
    }
  }, [selectedRank, selectedDynasty, selectorMode])

  return (
    <div className="bg-amber-950/40 border border-amber-800/30 rounded-xl p-5 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-6 bg-red-700 rounded-full" />
        <h2 className="text-lg font-serif text-amber-100 font-semibold">选择官职</h2>
      </div>

      <div className="flex gap-2 mb-4">
        {(['official', 'rank'] as SelectorMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => setSelectorMode(mode)}
            className={`
              px-4 py-2 rounded-lg text-sm font-serif transition-all duration-300
              ${selectorMode === mode
                ? 'bg-red-800/80 text-amber-100 shadow-md'
                : 'bg-amber-900/40 text-amber-300/70 hover:bg-amber-900/60'
              }
            `}
          >
            {mode === 'official' ? '按官职' : '按品级'}
          </button>
        ))}
      </div>

      {selectorMode === 'official' ? (
        <div className="space-y-3">
          {categories.map(cat => (
            <div key={cat}>
              <span className="text-xs text-amber-500/60 font-serif mb-1 block">{cat}</span>
              <div className="flex flex-wrap gap-2">
                {officials
                  .filter(o => o.category === cat)
                  .map(o => {
                    const isActive = selectedOfficial === o.id
                    const rankInfo = o.ranksByDynasty[selectedDynasty]
                    return (
                      <button
                        key={o.id}
                        onClick={() => setSelectedOfficial(o.id)}
                        className={`
                          px-3 py-1.5 rounded-lg text-sm font-serif transition-all duration-300
                          border
                          ${isActive
                            ? 'bg-red-800/70 border-red-700/60 text-amber-100 shadow-sm'
                            : 'bg-amber-900/30 border-amber-800/20 text-amber-300/70 hover:border-amber-700/40'
                          }
                        `}
                      >
                        {o.name}
                        <span className="text-[10px] ml-1 opacity-60">
                          {rankInfo?.rankName || ''}
                        </span>
                      </button>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            {rankOptions.map(r => (
              <button
                key={r.value}
                onClick={() => setSelectedRank(r.value)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-serif transition-all duration-300
                  border
                  ${selectedRank === r.value
                    ? 'bg-red-800/70 border-red-700/60 text-amber-100 shadow-sm'
                    : 'bg-amber-900/30 border-amber-800/20 text-amber-300/70 hover:border-amber-700/40'
                  }
                `}
              >
                {r.label}
              </button>
            ))}
          </div>

          {filteredByRank.length > 0 && (
            <div>
              <span className="text-xs text-amber-500/60 font-serif mb-1 block">
                {rankOptions.find(r => r.value === selectedRank)?.label}官职
              </span>
              <div className="flex flex-wrap gap-2">
                {filteredByRank.map(o => {
                  const isActive = selectedOfficial === o.id
                  const rankInfo = o.ranksByDynasty[selectedDynasty]
                  return (
                    <button
                      key={o.id}
                      onClick={() => setSelectedOfficial(o.id)}
                      className={`
                        px-3 py-1.5 rounded-lg text-sm font-serif transition-all duration-300
                        border
                        ${isActive
                          ? 'bg-red-800/70 border-red-700/60 text-amber-100 shadow-sm'
                          : 'bg-amber-900/30 border-amber-800/20 text-amber-300/70 hover:border-amber-700/40'
                        }
                      `}
                    >
                      {o.name}
                      <span className="text-[10px] ml-1 opacity-60">
                        {rankInfo?.rankName || ''}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {filteredByRank.length === 0 && (
            <div className="text-center py-3 text-amber-500/30 font-serif text-xs">
              该朝代无此品级官职数据
            </div>
          )}
        </div>
      )}
    </div>
  )
}
