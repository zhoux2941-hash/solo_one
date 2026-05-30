import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { dynasties, dynastyMap } from '@/data/dynasties'
import { officials } from '@/data/officials'
import CompareChart from './CompareChart'

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

export default function DynastyCompare() {
  const compareDynastyA = useAppStore(s => s.compareDynastyA)
  const compareDynastyB = useAppStore(s => s.compareDynastyB)
  const selectedOfficial = useAppStore(s => s.selectedOfficial)
  const compareResult = useAppStore(s => s.compareResult)
  const setCompareDynastyA = useAppStore(s => s.setCompareDynastyA)
  const setCompareDynastyB = useAppStore(s => s.setCompareDynastyB)
  const computeCompare = useAppStore(s => s.computeCompare)

  const official = officials.find(o => o.id === selectedOfficial)

  useEffect(() => {
    computeCompare()
  }, [compareDynastyA, compareDynastyB, selectedOfficial, computeCompare])

  const dynastyA = dynastyMap[compareDynastyA]
  const dynastyB = dynastyMap[compareDynastyB]

  const yanglianA = compareDynastyA === 'qing' ? QING_YANGLIAN[selectedOfficial] || 0 : 0
  const yanglianB = compareDynastyB === 'qing' ? QING_YANGLIAN[selectedOfficial] || 0 : 0

  return (
    <div className="bg-amber-950/40 border border-amber-800/30 rounded-xl p-5 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-6 bg-red-700 rounded-full" />
        <h2 className="text-lg font-serif text-amber-100 font-semibold">朝代对比</h2>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <select
          value={compareDynastyA}
          onChange={e => setCompareDynastyA(e.target.value)}
          className="flex-1 bg-amber-950/60 border border-amber-700/30 rounded-lg px-3 py-2
            text-amber-100 font-serif text-sm
            focus:outline-none focus:border-red-700/60 transition-all duration-300"
        >
          {dynasties.map(d => (
            <option key={d.id} value={d.id}>{d.name} · {d.period}</option>
          ))}
        </select>

        <span className="text-red-600 font-serif text-lg font-bold">VS</span>

        <select
          value={compareDynastyB}
          onChange={e => setCompareDynastyB(e.target.value)}
          className="flex-1 bg-amber-950/60 border border-amber-700/30 rounded-lg px-3 py-2
            text-amber-100 font-serif text-sm
            focus:outline-none focus:border-red-700/60 transition-all duration-300"
        >
          {dynasties.map(d => (
            <option key={d.id} value={d.id}>{d.name} · {d.period}</option>
          ))}
        </select>
      </div>

      <div className="text-center text-sm text-amber-400/60 font-serif mb-4">
        对比官职：<span className="text-amber-200 font-semibold">{official?.name}</span>
      </div>

      {compareResult && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div
              className="rounded-lg p-4 border"
              style={{
                borderColor: dynastyA?.color + '40',
                backgroundColor: dynastyA?.color + '10',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="w-7 h-7 rounded flex items-center justify-center text-sm font-serif font-bold"
                  style={{ backgroundColor: dynastyA?.color + '30', color: dynastyA?.color }}
                >
                  {dynastyA?.name}
                </span>
                <span className="text-amber-200 font-serif font-semibold text-sm">
                  {official?.name}
                </span>
              </div>

              <div className="space-y-2">
                {compareResult.salaryA.money > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-amber-500/60 font-serif">
                      {compareDynastyA === 'qing' ? '正俸' : '钱银'}
                    </span>
                    <span className="text-amber-200 font-serif">
                      {compareResult.salaryA.money} {compareResult.salaryA.moneyUnit}
                    </span>
                  </div>
                )}
                {compareDynastyA === 'qing' && yanglianA > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-red-400/70 font-serif">养廉银</span>
                    <span className="text-red-300 font-serif">
                      {yanglianA} 两/年
                    </span>
                  </div>
                )}
                {compareResult.salaryA.grain > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-amber-500/60 font-serif">禄米</span>
                    <span className="text-amber-200 font-serif">
                      {compareResult.salaryA.grain} {compareResult.salaryA.grainUnit}
                    </span>
                  </div>
                )}
                {compareResult.salaryA.officeLand > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-amber-500/60 font-serif">职田</span>
                    <span className="text-amber-200 font-serif">
                      {compareResult.salaryA.officeLand} {compareResult.salaryA.officeLandUnit}
                    </span>
                  </div>
                )}
                <div className="border-t border-amber-800/20 pt-2 flex justify-between text-xs">
                  <span className="text-amber-500/60 font-serif">折合米</span>
                  <span className="text-red-300 font-serif font-semibold">
                    {compareResult.riceQuantityA} 石/年
                  </span>
                </div>
              </div>
            </div>

            <div
              className="rounded-lg p-4 border"
              style={{
                borderColor: dynastyB?.color + '40',
                backgroundColor: dynastyB?.color + '10',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="w-7 h-7 rounded flex items-center justify-center text-sm font-serif font-bold"
                  style={{ backgroundColor: dynastyB?.color + '30', color: dynastyB?.color }}
                >
                  {dynastyB?.name}
                </span>
                <span className="text-amber-200 font-serif font-semibold text-sm">
                  {official?.name}
                </span>
              </div>

              <div className="space-y-2">
                {compareResult.salaryB.money > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-amber-500/60 font-serif">
                      {compareDynastyB === 'qing' ? '正俸' : '钱银'}
                    </span>
                    <span className="text-amber-200 font-serif">
                      {compareResult.salaryB.money} {compareResult.salaryB.moneyUnit}
                    </span>
                  </div>
                )}
                {compareDynastyB === 'qing' && yanglianB > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-red-400/70 font-serif">养廉银</span>
                    <span className="text-red-300 font-serif">
                      {yanglianB} 两/年
                    </span>
                  </div>
                )}
                {compareResult.salaryB.grain > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-amber-500/60 font-serif">禄米</span>
                    <span className="text-amber-200 font-serif">
                      {compareResult.salaryB.grain} {compareResult.salaryB.grainUnit}
                    </span>
                  </div>
                )}
                {compareResult.salaryB.officeLand > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-amber-500/60 font-serif">职田</span>
                    <span className="text-amber-200 font-serif">
                      {compareResult.salaryB.officeLand} {compareResult.salaryB.officeLandUnit}
                    </span>
                  </div>
                )}
                <div className="border-t border-amber-800/20 pt-2 flex justify-between text-xs">
                  <span className="text-amber-500/60 font-serif">折合米</span>
                  <span className="text-red-300 font-serif font-semibold">
                    {compareResult.riceQuantityB} 石/年
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-900/20 to-amber-900/20 rounded-lg p-4 border border-red-800/20 mb-4">
            <div className="text-center">
              <span className="text-xs text-amber-500/60 font-serif">购买力差距</span>
              <div className="flex items-center justify-center gap-3 mt-1">
                <span className="text-sm text-amber-300 font-serif">
                  {dynastyA?.name} {compareResult.riceQuantityA}石
                </span>
                <span className="text-red-600 font-bold">
                  {compareResult.diffPercent > 0 ? '+' : ''}{compareResult.diffPercent}%
                </span>
                <span className="text-sm text-amber-300 font-serif">
                  {dynastyB?.name} {compareResult.riceQuantityB}石
                </span>
              </div>
              {Math.abs(compareResult.diffPercent) > 50 && (
                <div className="text-xs text-red-400/60 font-serif mt-2">
                  {compareResult.diffPercent > 0
                    ? `${dynastyA?.name}该官职购买力显著高于${dynastyB?.name}`
                    : `${dynastyB?.name}该官职购买力显著高于${dynastyA?.name}`
                  }
                </div>
              )}
            </div>
          </div>

          <CompareChart
            dynastyA={compareDynastyA}
            dynastyB={compareDynastyB}
            riceA={compareResult.riceQuantityA}
            riceB={compareResult.riceQuantityB}
            officialName={official?.name || ''}
          />
        </>
      )}
    </div>
  )
}
