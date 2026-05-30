import GameCanvas, { useGameLoop } from '@/components/GameCanvas'
import GameHUD from '@/components/GameHUD'
import GameOver from '@/components/GameOver'
import { GameProvider, useGame } from '@/components/GameProvider'
import { useGameStore } from '@/store/gameStore'

function GameContent() {
  const gameStatus = useGameStore(s => s.gameStatus)
  const { startGame } = useGame()

  return (
    <div className="w-screen h-screen bg-stone-950 overflow-hidden relative select-none">
      <GameCanvas />
      <GameHUD />
      <GameOver />

      {gameStatus === 'idle' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-amber-700/60 rounded-2xl px-10 py-10 min-w-[420px] text-center shadow-2xl shadow-amber-900/30">
            <div className="absolute -top-px -left-px -right-px -bottom-px border border-amber-500/20 rounded-2xl pointer-events-none" />

            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-amber-600/50 rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-amber-600/50 rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-amber-600/50 rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-amber-600/50 rounded-br-lg" />

            <h1 className="text-4xl font-black text-amber-400 mb-2 tracking-wider">
              磨盘秋千
            </h1>
            <p className="text-amber-200/50 text-sm mb-8">
              彝族传统平衡游戏
            </p>

            <div className="space-y-3 text-left text-amber-200/70 text-sm mb-8 px-4">
              <div className="flex items-start gap-3">
                <span className="text-amber-500 mt-0.5">●</span>
                <span>用 <kbd className="bg-amber-900/50 px-1.5 py-0.5 rounded text-amber-300 font-bold">←</kbd> <kbd className="bg-amber-900/50 px-1.5 py-0.5 rounded text-amber-300 font-bold">→</kbd> 箭头键在圆盘上移动</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-amber-500 mt-0.5">●</span>
                <span>移动到合适位置保持圆盘平衡</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-amber-500 mt-0.5">●</span>
                <span>圆盘倾斜时向重的一侧移动</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-amber-500 mt-0.5">●</span>
                <span>保持平衡越久，旋转圈数越多，得分越高</span>
              </div>
            </div>

            <button
              onClick={startGame}
              className="pointer-events-auto w-full py-3.5 px-6 bg-gradient-to-b from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-amber-100 font-bold text-lg rounded-xl border border-amber-500/40 shadow-lg shadow-amber-900/30 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              开始游戏
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function GamePage() {
  const canvasRef = useGameLoop()

  return (
    <GameProvider canvasRef={canvasRef}>
      <GameContent />
    </GameProvider>
  )
}
