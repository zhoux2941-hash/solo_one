import { useGameStore } from '@/store/gameStore'
import { useGame } from '@/components/GameProvider'

export default function GameOver() {
  const gameStatus = useGameStore(s => s.gameStatus)
  const score = useGameStore(s => s.score)
  const rotationCount = useGameStore(s => s.rotationCount)
  const elapsedTime = useGameStore(s => s.elapsedTime)
  const { startGame } = useGame()

  if (gameStatus !== 'ended') return null

  const mins = Math.floor(elapsedTime / 60)
  const secs = Math.floor(elapsedTime % 60)

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-amber-700/60 rounded-2xl px-10 py-8 min-w-[340px] text-center shadow-2xl shadow-amber-900/20">
        <div className="absolute -top-px -left-px -right-px -bottom-px border border-amber-500/20 rounded-2xl pointer-events-none" />

        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-amber-600/50 rounded-tl" />
        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-amber-600/50 rounded-tr" />
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-amber-600/50 rounded-bl" />
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-amber-600/50 rounded-br" />

        <h2 className="text-3xl font-black text-amber-400 mb-6 tracking-wider">
          游戏结束
        </h2>

        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center border-b border-amber-900/40 pb-3">
            <span className="text-amber-200/70 text-sm">最终得分</span>
            <span className="text-2xl font-black text-amber-300 tabular-nums">{score}</span>
          </div>
          <div className="flex justify-between items-center border-b border-amber-900/40 pb-3">
            <span className="text-amber-200/70 text-sm">旋转圈数</span>
            <span className="text-xl font-bold text-white tabular-nums">{rotationCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-amber-200/70 text-sm">坚持时间</span>
            <span className="text-xl font-bold text-white tabular-nums">
              {mins > 0 ? `${mins}分` : ''}{secs}秒
            </span>
          </div>
        </div>

        <button
          onClick={startGame}
          className="pointer-events-auto w-full py-3 px-6 bg-gradient-to-b from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-amber-100 font-bold rounded-xl border border-amber-500/40 shadow-lg shadow-amber-900/30 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          再来一次
        </button>
      </div>
    </div>
  )
}
