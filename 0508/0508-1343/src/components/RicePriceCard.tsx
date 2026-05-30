import { ricePrices } from '@/data/ricePrices'
import { dynastyMap } from '@/data/dynasties'
import { SHI_TO_KG } from '@/data/ricePrices'

export default function RicePriceCard() {
  return (
    <div className="bg-amber-950/40 border border-amber-800/30 rounded-xl p-5 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-6 bg-red-700 rounded-full" />
        <h2 className="text-lg font-serif text-amber-100 font-semibold">各朝米价参考</h2>
      </div>

      <div className="text-xs text-amber-500/40 font-serif mb-3">
        1石 ≈ {SHI_TO_KG}kg · 购买力折算以米价为基准
      </div>

      <div className="grid grid-cols-3 gap-2">
        {ricePrices.map(rp => {
          const dynasty = dynastyMap[rp.dynastyId]
          return (
            <div
              key={rp.dynastyId}
              className="rounded-lg p-3 border border-amber-800/15 bg-amber-950/30
                hover:border-amber-700/30 transition-all duration-300"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-serif font-bold"
                  style={{ backgroundColor: dynasty?.color + '30', color: dynasty?.color }}
                >
                  {dynasty?.name}
                </span>
                <span className="text-[10px] text-amber-500/40 font-serif">{dynasty?.period}</span>
              </div>

              <div className="text-amber-200 font-serif font-bold text-sm">
                {rp.pricePerShi}
                <span className="text-[10px] text-amber-400/40 ml-1">{rp.currencyUnit}</span>
              </div>

              <div className="text-[10px] text-amber-600/30 font-serif mt-1 leading-tight">
                {rp.note}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
