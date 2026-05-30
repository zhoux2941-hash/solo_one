import { Target, Trophy, RotateCcw } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { TARGET_RINGS } from '@/types/game';

export default function ScoreBoard() {
  const { scores, totalScore, arrowsRemaining, gameOver, resetGame } = useGameStore();

  const getScoreColor = (score: number) => {
    if (score === 0) return 'bg-slate-600';
    const ring = TARGET_RINGS.find(r => r.score === score);
    if (!ring) return 'bg-slate-600';
    if (ring.color === '#FFFFFF') return 'bg-white text-slate-900';
    if (ring.color === '#22C55E') return 'bg-green-500';
    if (ring.color === '#3B82F6') return 'bg-blue-500';
    if (ring.color === '#EAB308') return 'bg-yellow-500 text-slate-900';
    if (ring.color === '#EF4444') return 'bg-red-500';
    return 'bg-slate-600';
  };

  const getScoreName = (score: number) => {
    if (score === 0) return '脱靶';
    const ring = TARGET_RINGS.find(r => r.score === score);
    return ring?.name || '';
  };

  const getResultMessage = () => {
    if (totalScore >= 25) return { text: '神射手！百发百中！', color: 'text-yellow-400' };
    if (totalScore >= 20) return { text: '优秀！箭术精湛！', color: 'text-green-400' };
    if (totalScore >= 15) return { text: '不错！继续加油！', color: 'text-blue-400' };
    if (totalScore >= 10) return { text: '还可以，多练习！', color: 'text-amber-400' };
    return { text: '再接再厉！', color: 'text-slate-400' };
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-2 border-amber-500/50 rounded-xl p-5 shadow-xl min-w-[280px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-amber-400" />
          <span className="text-amber-100 font-bold">计分板</span>
        </div>
        <div className="flex items-center gap-1">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="text-amber-300 text-sm font-medium">第1轮</span>
        </div>
      </div>

      <div className="space-y-3 mb-5">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-2 rounded-lg bg-slate-700/50"
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-600 text-amber-300 font-bold text-sm">
              {index + 1}
            </div>
            
            {index < scores.length ? (
              <>
                <div className={`w-12 h-12 rounded-full ${getScoreColor(scores[index])} flex items-center justify-center shadow-lg`}>
                  <span className="font-bold text-xl">{scores[index]}</span>
                </div>
                <div className="flex-1">
                  <div className="text-amber-100 font-medium">
                    {getScoreName(scores[index])}
                  </div>
                  <div className="text-amber-400/70 text-xs">
                    {scores[index] > 0 ? `${scores[index]}分` : '0分'}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-500 flex items-center justify-center">
                  <span className="text-slate-500 text-2xl">-</span>
                </div>
                <div className="flex-1">
                  <div className="text-slate-500">
                    {index === scores.length ? '准备发射' : '等待发射'}
                  </div>
                  <div className="text-amber-400/50 text-xs">
                    剩余 {arrowsRemaining} 箭
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-slate-600 pt-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-amber-200 font-medium">本轮总分</span>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-amber-300">{totalScore}</span>
            <span className="text-amber-400/70 text-sm">/ 30</span>
          </div>
        </div>
        
        {gameOver && (
          <div className={`mt-2 text-center font-bold animate-pulse ${getResultMessage().color}`}>
            {getResultMessage().text}
          </div>
        )}
      </div>

      <button
        onClick={resetGame}
        className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
      >
        <RotateCcw className="w-4 h-4" />
        重新开始
      </button>
    </div>
  );
}
