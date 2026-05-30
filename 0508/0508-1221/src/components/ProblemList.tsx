import { useGameStore } from '@/store/gameStore';
import { problems } from '@/data/problems';
import { Category } from '@/types';
import { Star, Check, Lock } from 'lucide-react';

const categoryLabels: Record<string, string> = {
  all: '全部',
  corner: '角部死活',
  edge: '边部死活',
  center: '中央死活',
};

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-500/20 text-green-400',
  intermediate: 'bg-yellow-500/20 text-yellow-400',
  advanced: 'bg-red-500/20 text-red-400',
};

export default function ProblemList() {
  const currentProblemId = useGameStore(state => state.currentProblemId);
  const selectedCategory = useGameStore(state => state.selectedCategory);
  const progress = useGameStore(state => state.progress);
  const setCurrentProblem = useGameStore(state => state.setCurrentProblem);
  const setSelectedCategory = useGameStore(state => state.setSelectedCategory);

  const categories: Array<'all' | Category> = ['all', 'corner', 'edge', 'center'];

  const filteredProblems = selectedCategory === 'all'
    ? problems
    : problems.filter(p => p.category === selectedCategory);

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-serif font-bold text-white mb-3">题目列表</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                selectedCategory === cat
                  ? 'bg-white text-stone-dark font-medium'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-5 gap-2">
          {filteredProblems.map(problem => {
            const isActive = currentProblemId === problem.id;
            const probProgress = progress[problem.id];
            const isSolved = probProgress?.solved;

            return (
              <button
                key={problem.id}
                onClick={() => setCurrentProblem(problem.id)}
                className={`relative aspect-square rounded-lg flex flex-col items-center justify-center transition-all ${
                  isActive
                    ? 'bg-accent-red text-white ring-2 ring-accent-red/50'
                    : isSolved
                    ? 'bg-accent-green/20 text-accent-green hover:bg-accent-green/30'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-xs font-mono opacity-60">
                  {problem.id.replace('p', '')}
                </span>
                <div className="flex gap-0.5 mt-0.5">
                  {problem.difficulty === 'beginner' && <Star className="w-2.5 h-2.5 fill-current" />}
                  {problem.difficulty === 'intermediate' && (
                    <>
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <Star className="w-2.5 h-2.5 fill-current" />
                    </>
                  )}
                  {problem.difficulty === 'advanced' && (
                    <>
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <Star className="w-2.5 h-2.5 fill-current" />
                    </>
                  )}
                </div>
                {isSolved && (
                  <div className="absolute top-1 right-1">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-white/10">
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-accent-green/20" />
            <span className="text-white/60">已完成</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-accent-red" />
            <span className="text-white/60">当前</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-white/5" />
            <span className="text-white/60">未完成</span>
          </div>
        </div>
      </div>
    </div>
  );
}
