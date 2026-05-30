import { useGameStore } from '@/store/gameStore';
import { Star, Target, Layers } from 'lucide-react';

const categoryLabels: Record<string, string> = {
  corner: '角部死活',
  edge: '边部死活',
  center: '中央死活',
};

const difficultyStars: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

export default function ProblemInfo() {
  const currentProblem = useGameStore(state => state.currentProblem);

  if (!currentProblem) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <h2 className="text-xl font-serif font-bold text-white/80">题目信息</h2>
        <p className="text-white/60 mt-4">请从左侧列表选择题目</p>
      </div>
    );
  }

  const stars = difficultyStars[currentProblem.difficulty] || 1;

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-white">
            {currentProblem.id} - {currentProblem.title}
          </h2>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1 text-accent-green">
              <Target className="w-4 h-4" />
              <span className="text-sm">{categoryLabels[currentProblem.category]}</span>
            </div>
            <div className="flex items-center gap-1">
              <Layers className="w-4 h-4 text-white/60" />
              <span className="text-sm text-white/60">{currentProblem.boardSize}路棋盘</span>
            </div>
          </div>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Star
              key={i}
              className={`w-5 h-5 ${i < stars ? 'text-yellow-400 fill-yellow-400' : 'text-white/30'}`}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-white/10 pt-4 mt-4">
        <p className="text-white/80 font-medium">{currentProblem.description}</p>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-sm text-white/50">执子：</span>
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
            currentProblem.playerColor === 'black'
              ? 'bg-stone-black text-white'
              : 'bg-stone-white text-stone-black'
          }`}>
            <span className={`w-3 h-3 rounded-full ${
              currentProblem.playerColor === 'black' ? 'bg-stone-black ring-1 ring-white/30' : 'bg-stone-white ring-1 ring-black/20'
            }`} />
            {currentProblem.playerColor === 'black' ? '黑方' : '白方'}
          </span>
        </div>
      </div>
    </div>
  );
}
