import { useAppStore } from '@/store/useAppStore'
import { officialMap } from '@/data/officials'
import { dynastyMap } from '@/data/dynasties'
import { ricePriceMap, SHI_TO_KG } from '@/data/ricePrices'
import { salaryToRiceShi } from '@/utils/purchasingPower'
import { formatNumber, formatRiceKg } from '@/utils/unitConverter'
import SalaryChart from './SalaryChart'

const QING_YANGLIAN: Record<string, number> = {
  pm: 16000,
  shangshu: 10000,
  cishi: 3000,
  xianling: 1200,
  shiyushi: 2000,
  taiwei: 15000,
  langzhong: 1500,
  zhoubu: 60,
}

const QING_YANGLIAN_NOTES: Record<string, string> = {
  pm: '大学士养廉银约16000两/年',
  shangshu: '六部尚书养廉银约10000两/年',
  cishi: '知府/道员养廉银约3000两/年',
  xianling: '知县养廉银约1200两/年（400-2000两取中值）',
  shiyushi: '监察御史养廉银约2000两/年',
  taiwei: '提督养廉银约15000两/年',
  langzhong: '郎中养廉银约1500两/年',
  zhoubu: '主簿等杂官养廉银约60两/年',
}

export default function SalaryPanel() {
  const currentSalaryRecord = useAppStore(s => s.currentSalaryRecord)
  const selectedDynasty = useAppStore(s => s.selectedDynasty)
  const selectedOfficial = useAppStore(s => s.selectedOfficial)

  if (!currentSalaryRecord) {
    return (
      <div className="bg-amber-950/40 border border-amber-800/30 rounded-xl p-8 backdrop-blur-sm text-center">
        <p className="text-amber-400/50 font-serif">请选择朝代与官职查看俸禄详情</p>
      </div>
    )
  }

  const dynasty = dynastyMap[selectedDynasty]
  const official = officialMap[selectedOfficial]
  const salary = currentSalaryRecord.salary
  const rp = ricePriceMap[selectedDynasty]
  const riceShi = salaryToRiceShi(selectedDynasty, selectedOfficial, salary)
  const riceKg = riceShi * SHI_TO_KG

  const isQing = selectedDynasty === 'qing'
  const yanglian = isQing ? QING_YANGLIAN[selectedOfficial] || 0 : 0
  const yanglianNote = isQing ? QING_YANGLIAN_NOTES[selectedOfficial] || '' : ''

  const salaryItems = [
    {
      key: 'money',
      label: isQing ? '正俸银' : '钱银',
      value: salary.money > 0 ? formatNumber(salary.money) : '—',
      unit: salary.money > 0 ? salary.moneyUnit : '',
      icon: '💰',
      active: salary.money > 0,
    },
    {
      key: 'grain',
      label: '禄米',
      value: salary.grain > 0 ? formatNumber(salary.grain) : '—',
      unit: salary.grain > 0 ? salary.grainUnit : '',
      icon: '🌾',
      active: salary.grain > 0,
    },
    {
      key: 'land',
      label: '赐田',
      value: salary.land > 0 ? formatNumber(salary.land) : '—',
      unit: salary.land > 0 ? salary.landUnit : '',
      icon: '🏡',
      active: salary.land > 0,
    },
    {
      key: 'officeLand',
      label: '职田',
      value: salary.officeLand > 0 ? formatNumber(salary.officeLand) : '—',
      unit: salary.officeLand > 0 ? salary.officeLandUnit : '',
      icon: '🏯',
      active: salary.officeLand > 0,
    },
  ]

  return (
    <div className="bg-amber-950/40 border border-amber-800/30 rounded-xl p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-red-700 rounded-full" />
          <h2 className="text-lg font-serif text-amber-100 font-semibold">俸禄详情</h2>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 rounded text-xs font-serif"
            style={{ backgroundColor: dynasty?.color + '30', color: dynasty?.color }}
          >
            {dynasty?.name}
          </span>
          <span className="px-2 py-0.5 rounded text-xs font-serif bg-red-800/30 text-red-300">
            {currentSalaryRecord.rankName}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-amber-200 font-serif text-xl font-bold">{official?.name}</span>
        <span className="text-amber-500/50 text-sm font-serif">
          {dynasty?.period} · {currentSalaryRecord.rankName}
        </span>
      </div>

      <div className={`grid gap-3 mb-5 ${isQing ? 'grid-cols-5' : 'grid-cols-4'}`}>
        {salaryItems.map(item => (
          <div
            key={item.key}
            className={`
              rounded-lg p-3 border transition-all duration-300
              ${item.active
                ? 'bg-amber-900/30 border-amber-700/30'
                : 'bg-amber-950/20 border-amber-900/10 opacity-40'
              }
            `}
          >
            <div className="text-lg mb-1">{item.icon}</div>
            <div className="text-[10px] text-amber-500/60 font-serif">{item.label}</div>
            <div className="text-base font-serif text-amber-100 font-bold mt-0.5">
              {item.value}
            </div>
            {item.unit && (
              <div className="text-[10px] text-amber-400/40">{item.unit}</div>
            )}
          </div>
        ))}

        {isQing && (
          <div
            className={`
              rounded-lg p-3 border transition-all duration-300
              ${yanglian > 0
                ? 'bg-red-900/30 border-red-700/30'
                : 'bg-amber-950/20 border-amber-900/10 opacity-40'
              }
            `}
          >
            <div className="text-lg mb-1">🎁</div>
            <div className="text-[10px] text-red-400/70 font-serif">养廉银</div>
            <div className="text-base font-serif text-red-300 font-bold mt-0.5">
              {yanglian > 0 ? formatNumber(yanglian) : '—'}
            </div>
            <div className="text-[10px] text-red-400/40">两/年</div>
          </div>
        )}
      </div>

      {isQing && yanglianNote && (
        <div className="mb-4 text-[10px] text-red-400/50 font-serif bg-red-900/10 rounded px-3 py-1">
          📌 {yanglianNote}
        </div>
      )}

      <div className="bg-gradient-to-r from-red-900/20 to-amber-900/20 rounded-lg p-4 border border-red-800/20 mb-4">
        <div className="text-xs text-amber-500/60 font-serif mb-2">
          统一折米{isQing ? '（正俸+禄米+养廉银，按米价折算）' : '（禄米+职田+钱银，按米价折算）'}
        </div>
        <div className="flex items-baseline gap-4">
          <div>
            <span className="text-2xl font-serif text-red-300 font-bold">
              {Math.round(riceShi)}
            </span>
            <span className="text-sm text-amber-400/60 ml-1">石/年</span>
          </div>
          <div className="text-amber-600/40">≈</div>
          <div>
            <span className="text-2xl font-serif text-amber-200 font-bold">
              {formatRiceKg(riceKg)}
            </span>
            <span className="text-sm text-amber-400/60 ml-1">米/年</span>
          </div>
        </div>
        {rp && (
          <div className="text-[10px] text-amber-500/40 mt-1 font-serif">
            参考米价：{rp.pricePerShi} {rp.currencyUnit} · {rp.note}
          </div>
        )}
      </div>

      <SalaryChart officialId={selectedOfficial} dynastyId={selectedDynasty} />

      {currentSalaryRecord.note && (
        <div className="mt-3 text-xs text-amber-500/50 font-serif italic border-t border-amber-800/20 pt-3">
          📜 {currentSalaryRecord.note}
        </div>
      )}
    </div>
  )
}
