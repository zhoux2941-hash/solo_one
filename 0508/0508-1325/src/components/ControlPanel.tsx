import { Trophy, RotateCcw, Target, Play } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { ZhuangBorder } from './GameDecorations';

export function ControlPanel() {
  const { status, isBallFlying, currentRound, totalRounds, currentScore, highScore, startGame, throwBall, resetGame } = useGameStore();

  return (
    <div className="w-full max-w-4xl mx-auto mt-6 space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <ZhuangBorder>
          <div className="bg-zhuang-darkBlue/90 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-zhuang-yellow mb-1">
              <Trophy size={20} />
              <span className="text-sm">最高分</span>
            </div>
            <div className="text-3xl font-display text-white">{highScore}</div>
          </div>
        </ZhuangBorder>

        <ZhuangBorder>
          <div className="bg-zhuang-darkBlue/90 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-zhuang-green mb-1">
              <Target size={20} />
              <span className="text-sm">当前分</span>
            </div>
            <div className="text-3xl font-display text-white">{currentScore}</div>
          </div>
        </ZhuangBorder>

        <ZhuangBorder>
          <div className="bg-zhuang-darkBlue/90 rounded-lg p-4 text-center">
            <div className="text-zhuang-orange mb-1 text-sm">第 {currentRound} / {totalRounds} 轮</div>
            <div className="flex gap-1 justify-center mt-2">
              {[...Array(totalRounds)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all ${
                    i < currentRound - 1
                      ? 'bg-zhuang-green'
                      : i === currentRound - 1
                      ? 'bg-zhuang-yellow animate-pulse'
                      : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </ZhuangBorder>

        <ZhuangBorder>
          <div className="bg-zhuang-darkBlue/90 rounded-lg p-4 text-center">
            <div className="text-zhuang-blue mb-1 text-sm">剩余次数</div>
            <div className="text-3xl font-display text-white">
              {Math.max(0, totalRounds - currentRound + 1)}
            </div>
          </div>
        </ZhuangBorder>
      </div>

      <div className="flex justify-center gap-4">
        {status === 'idle' && (
          <button
            onClick={startGame}
            className="btn-3d relative px-12 py-4 bg-gradient-to-b from-zhuang-green to-zhuang-darkBlue text-white text-xl font-display rounded-xl shadow-lg hover:shadow-xl transition-all animate-pulseGlow"
          >
            <span className="flex items-center gap-2">
              <Play size={24} />
              开始游戏
            </span>
            <div className="absolute inset-0 rounded-xl border-2 border-zhuang-yellow/50" />
          </button>
        )}

        {(status === 'playing' || status === 'throwing') && (
          <button
            onClick={throwBall}
            disabled={isBallFlying || status === 'throwing'}
            className={`relative px-16 py-6 text-white text-2xl font-display rounded-xl shadow-lg transition-all ${
              isBallFlying || status === 'throwing'
                ? 'bg-gray-600 cursor-not-allowed opacity-70'
                : 'btn-3d bg-gradient-to-b from-zhuang-red to-red-700 hover:shadow-xl animate-pulseGlow'
            }`}
          >
            <span className="flex items-center gap-2">
              {isBallFlying || status === 'throwing' ? (
                <>
                  <span className="animate-spin">⏳</span>
                  飞行中...
                </>
              ) : (
                <>
                  🎯 抛球
                </>
              )}
            </span>
            {!isBallFlying && status === 'playing' && (
              <div className="absolute inset-0 rounded-xl border-2 border-zhuang-yellow/50" />
            )}
          </button>
        )}

        {(status === 'finished' || status === 'playing' || status === 'throwing') && (
          <button
            onClick={resetGame}
            className="btn-3d px-6 py-4 bg-gradient-to-b from-zhuang-blue to-zhuang-darkBlue text-white text-lg font-display rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <span className="flex items-center gap-2">
              <RotateCcw size={20} />
              重新开始
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
