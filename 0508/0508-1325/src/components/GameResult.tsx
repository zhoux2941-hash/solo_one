import { Trophy, Star, RotateCcw } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { ZhuangBorder } from './GameDecorations';

export function GameResult() {
  const { status, currentScore, highScore, throwResults, resetGame } = useGameStore();

  if (status !== 'finished') return null;

  const isNewRecord = currentScore === highScore && currentScore > 0;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <ZhuangBorder>
        <div className="bg-gradient-to-b from-zhuang-darkBlue to-zhuang-blue rounded-xl p-8 max-w-md w-full mx-4 animate-float">
          <div className="text-center mb-6">
            {isNewRecord ? (
              <>
                <div className="text-6xl mb-2">🎉</div>
                <h2 className="text-3xl font-display text-zhuang-yellow mb-2">新纪录!</h2>
                <div className="flex justify-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={24} className="text-zhuang-yellow fill-zhuang-yellow" />
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="text-5xl mb-2">🎊</div>
                <h2 className="text-3xl font-display text-zhuang-cream mb-2">游戏结束</h2>
              </>
            )}
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-black/30 rounded-xl p-4 text-center">
              <div className="text-zhuang-yellow text-lg mb-1">本轮得分</div>
              <div className="text-5xl font-display text-white">{currentScore}</div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 bg-black/30 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-zhuang-orange text-sm mb-1">
                  <Trophy size={16} />
                  最高分
                </div>
                <div className="text-2xl font-display text-white">{highScore}</div>
              </div>
              <div className="flex-1 bg-black/30 rounded-xl p-3 text-center">
                <div className="text-zhuang-green text-sm mb-1">命中次数</div>
                <div className="text-2xl font-display text-white">
                  {throwResults.filter(r => r.success).length} / {throwResults.length}
                </div>
              </div>
            </div>

            <div className="bg-black/30 rounded-xl p-3">
              <div className="text-zhuang-cream text-sm mb-2">各轮得分:</div>
              <div className="flex gap-2 justify-center flex-wrap">
                {throwResults.map((result, i) => (
                  <div
                    key={i}
                    className={`px-3 py-1 rounded-lg text-sm font-bold ${
                      result.success
                        ? 'bg-zhuang-green text-white'
                        : 'bg-gray-600 text-gray-300'
                    }`}
                  >
                    {result.score > 0 ? `+${result.score}` : '0'}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={resetGame}
            className="w-full btn-3d py-4 bg-gradient-to-b from-zhuang-red to-red-700 text-white text-xl font-display rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <span className="flex items-center justify-center gap-2">
              <RotateCcw size={20} />
              再来一局
            </span>
          </button>
        </div>
      </ZhuangBorder>
    </div>
  );
}
