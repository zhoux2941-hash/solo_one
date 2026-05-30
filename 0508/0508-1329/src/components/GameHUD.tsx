import { useGameStore } from '@/store/gameStore'

export default function GameHUD() {
  const balancePercent = useGameStore(s => s.balancePercent)
  const rotationCount = useGameStore(s => s.rotationCount)
  const score = useGameStore(s => s.score)
  const gameStatus = useGameStore(s => s.gameStatus)

  const balanceColor = balancePercent > 60
    ? 'text-emerald-400'
    : balancePercent > 30
      ? 'text-amber-400'
      : 'text-red-400'

  const balanceBarColor = balancePercent > 60
    ? 'bg-emerald-500'
    : balancePercent > 30
      ? 'bg-amber-500'
      : 'bg-red-500'

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      <div className="absolute top-6 left-6 flex flex-col gap-2">
        <div className="bg-black/50 backdrop-blur-sm border border-amber-700/50 rounded-lg px-4 py-3 min-w-[180px]">
          <div className="text-amber-400 text-xs font-bold tracking-wider mb-1">平衡度</div>
          <div className={`text-3xl font-black tabular-nums ${balanceColor}`}>
            {Math.round(balancePercent)}%
          </div>
          <div className="mt-2 h-2 bg-black/40 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-100 ${balanceBarColor}`}
              style={{ width: `${balancePercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="absolute top-6 right-6 flex flex-col gap-2 items-end">
        <div className="bg-black/50 backdrop-blur-sm border border-amber-700/50 rounded-lg px-4 py-3 min-w-[140px] text-right">
          <div className="text-amber-400 text-xs font-bold tracking-wider mb-1">旋转圈数</div>
          <div className="text-2xl font-black text-white tabular-nums">
            {rotationCount}
          </div>
        </div>
        <div className="bg-black/50 backdrop-blur-sm border border-amber-700/50 rounded-lg px-4 py-3 min-w-[140px] text-right">
          <div className="text-amber-400 text-xs font-bold tracking-wider mb-1">得分</div>
          <div className="text-2xl font-black text-amber-300 tabular-nums">
            {score}
          </div>
        </div>
      </div>

      {gameStatus === 'idle' && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="bg-black/60 backdrop-blur-sm border border-amber-700/50 rounded-lg px-6 py-3 text-center">
            <div className="text-amber-200 text-sm">
              按 <kbd className="bg-amber-900/60 px-2 py-0.5 rounded text-amber-300 mx-1 font-bold">←</kbd>
              <kbd className="bg-amber-900/60 px-2 py-0.5 rounded text-amber-300 mx-1 font-bold">→</kbd>
              移动角色保持平衡
            </div>
          </div>
        </div>
      )}

      {gameStatus === 'playing' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-4 text-amber-400/60 text-xs">
            <div className="flex items-center gap-1">
              <kbd className="bg-black/40 border border-amber-800/40 px-2 py-0.5 rounded">←</kbd>
              <span>左移</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="bg-black/40 border border-amber-800/40 px-2 py-0.5 rounded">→</kbd>
              <span>右移</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
