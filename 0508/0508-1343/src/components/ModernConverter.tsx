import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { dynastyMap } from '@/data/dynasties'
import { formatRiceKg } from '@/utils/unitConverter'
import type { PurchasingPowerResult } from '@/types'

export default function ModernConverter() {
  const modernSalary = useAppStore(s => s.modernSalary)
  const setModernSalary = useAppStore(s => s.setModernSalary)
  const purchasingPowerResults = useAppStore(s => s.purchasingPowerResults)
  const computePurchasingPower = useAppStore(s => s.computePurchasingPower)
  const [inputValue, setInputValue] = useState(String(modernSalary))

  const handleCompute = () => {
    const val = parseFloat(inputValue)
    if (!isNaN(val) && val > 0) {
      setModernSalary(val)
      computePurchasingPower()
    }
  }

  return (
    <div className="bg-amber-950/40 border border-amber-800/30 rounded-xl p-5 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-6 bg-red-700 rounded-full" />
        <h2 className="text-lg font-serif text-amber-100 font-semibold">现代工资折算</h2>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <span className="text-amber-300/70 font-serif text-sm whitespace-nowrap">月薪</span>
        <div className="relative flex-1">
          <input
            type="number"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCompute()}
            className="w-full bg-amber-950/60 border border-amber-700/30 rounded-lg px-4 py-2.5
              text-amber-100 font-serif text-lg
              placeholder-amber-600/30
              focus:outline-none focus:border-red-700/60 focus:ring-1 focus:ring-red-700/30
              transition-all duration-300"
            placeholder="输入月薪（元）"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500/40 text-sm">
            元/月
          </span>
        </div>
        <button
          onClick={handleCompute}
          className="px-5 py-2.5 bg-red-800/70 hover:bg-red-700/80 text-amber-100 rounded-lg
            font-serif text-sm transition-all duration-300 shadow-sm hover:shadow-md
            border border-red-700/30"
        >
          折算
        </button>
      </div>

      {purchasingPowerResults.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {purchasingPowerResults.map((result: PurchasingPowerResult) => {
            const dynasty = dynastyMap[result.dynastyId]
            return (
              <div
                key={result.dynastyId}
                className="bg-amber-950/50 border border-amber-800/20 rounded-lg p-3
                  hover:border-amber-700/40 transition-all duration-300
                  relative overflow-hidden"
              >
                <div
                  className="absolute top-0 right-0 w-16 h-16 opacity-5 font-serif text-4xl font-bold leading-none"
                  style={{ color: dynasty?.color }}
                >
                  {result.dynastyName}
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-6 h-6 rounded flex items-center justify-center text-xs font-serif font-bold"
                      style={{ backgroundColor: dynasty?.color + '30', color: dynasty?.color }}
                    >
                      {result.dynastyName}
                    </span>
                    <span className="text-xs text-amber-400/50 font-serif">
                      {result.equivalentRankName}
                    </span>
                  </div>

                  <div className="text-amber-100 font-serif font-bold text-sm mb-1">
                    ≈ {result.equivalentTitle}
                  </div>

                  <div className="text-xs text-amber-500/50 font-serif">
                    购米 {formatRiceKg(result.modernRiceKg)}/年
                  </div>

                  <div className="text-[10px] text-amber-600/30 font-serif mt-1">
                    {result.riceShi}石米/年
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {purchasingPowerResults.length === 0 && (
        <div className="text-center py-6 text-amber-500/30 font-serif text-sm">
          输入月薪并点击"折算"查看各朝代对应官职
        </div>
      )}
    </div>
  )
}
