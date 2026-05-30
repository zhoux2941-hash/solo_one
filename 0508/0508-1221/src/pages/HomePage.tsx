import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { problems } from '@/data/problems';
import { Category } from '@/types';
import { Play, Trophy, Star, Target, Layers, ChevronRight } from 'lucide-react';

const categoryLabels: Record<string, string> = {
  corner: '角部死活',
  edge: '边部死活',
  center: '中央死活',
};

const categoryDescriptions: Record<string, string> = {
  corner: '角部是死活题最常见的区域，掌握角部常形是提高棋力的关键',
  edge: '边部死活的空间相对较大，但也有其独特的规律和手筋',
  center: '中央死活最考验计算能力，是高阶棋手的必修课',
};

export default function HomePage() {
  const navigate = useNavigate();
  const progress = useGameStore(state => state.progress);
  const setSelectedCategory = useGameStore(state => state.setSelectedCategory);

  const solvedCount = Object.values(progress).filter(p => p.solved).length;
  const totalProblems = problems.length;

  const categories: Category[] = ['corner', 'edge', 'center'];

  const getCategoryStats = (category: Category) => {
    const categoryProblems = problems.filter(p => p.category === category);
    const solved = categoryProblems.filter(p => progress[p.id]?.solved).length;
    return { solved, total: categoryProblems.length };
  };

  const handleStartPractice = (category?: Category) => {
    if (category) {
      setSelectedCategory(category);
      const firstProblem = problems.find(p => p.category === category);
      if (firstProblem) {
        navigate(`/practice/${firstProblem.id}`);
      }
    } else {
      setSelectedCategory('all');
      if (problems.length > 0) {
        navigate(`/practice/${problems[0].id}`);
      }
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-board-wood to-amber-700 rounded-2xl mb-6 shadow-lg">
            <span className="text-4xl">⚫</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 text-shadow-sm">
            围棋死活题练习
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            精选 50 道死活题，从初级到高级，覆盖角部、边部、中央三大类别
            <br />帮助您系统提升围棋计算能力
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-accent-green/20 rounded-full mb-3">
              <Trophy className="w-6 h-6 text-accent-green" />
            </div>
            <div className="text-3xl font-bold text-white">
              {solvedCount}<span className="text-lg text-white/50">/{totalProblems}</span>
            </div>
            <div className="text-white/60 text-sm">已完成题目</div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-500/20 rounded-full mb-3">
              <Star className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold text-white">
              {totalProblems}
            </div>
            <div className="text-white/60 text-sm">题目总数</div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-full mb-3">
              <Layers className="w-6 h-6 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white">
              3
            </div>
            <div className="text-white/60 text-sm">难度等级</div>
          </div>
        </div>

        <div className="mb-8">
          <button
            onClick={() => handleStartPractice()}
            className="w-full flex items-center justify-center gap-3 py-5 bg-gradient-to-r from-accent-red to-red-600 hover:from-accent-red/90 hover:to-red-600/90 text-white text-xl font-bold rounded-xl btn-hover shadow-lg shadow-accent-red/25 transition-all"
          >
            <Play className="w-6 h-6" />
            开始练习
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-white mb-4">按分类练习</h2>
          {categories.map(category => {
            const stats = getCategoryStats(category);
            const progress = (stats.solved / stats.total) * 100;

            return (
              <button
                key={category}
                onClick={() => handleStartPractice(category)}
                className="w-full bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-board-wood/30 rounded-lg flex items-center justify-center">
                      <Target className="w-6 h-6 text-board-wood" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-board-wood transition-colors">
                        {categoryLabels[category]}
                      </h3>
                      <p className="text-white/60 text-sm max-w-md">
                        {categoryDescriptions[category]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-white font-mono">
                        {stats.solved}/{stats.total}
                      </div>
                      <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-accent-green transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-white/40 group-hover:text-white transition-colors" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <footer className="mt-16 text-center text-white/40 text-sm">
          <p>点击棋盘落子解题 · 支持提示和参考答案 · 记录解题进度</p>
        </footer>
      </div>
    </div>
  );
}
