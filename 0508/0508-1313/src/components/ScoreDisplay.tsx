import { Award, Target, TrendingUp } from 'lucide-react';

interface ScoreDisplayProps {
  total: number;
  correct: number;
  accuracy: number;
}

export const ScoreDisplay = ({ total, correct, accuracy }: ScoreDisplayProps) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="p-4 rounded-xl bg-gradient-to-br from-amber-900/50 to-stone-800/50 border border-amber-700/30 text-center">
        <Target className="w-5 h-5 text-amber-400 mx-auto mb-1" />
        <div className="text-2xl font-bold text-amber-100">{total}</div>
        <div className="text-xs text-amber-300/70">总答题数</div>
      </div>
      <div className="p-4 rounded-xl bg-gradient-to-br from-green-900/50 to-stone-800/50 border border-green-700/30 text-center">
        <Award className="w-5 h-5 text-green-400 mx-auto mb-1" />
        <div className="text-2xl font-bold text-green-100">{correct}</div>
        <div className="text-xs text-green-300/70">正确数</div>
      </div>
      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-900/50 to-stone-800/50 border border-blue-700/30 text-center">
        <TrendingUp className="w-5 h-5 text-blue-400 mx-auto mb-1" />
        <div className="text-2xl font-bold text-blue-100">{accuracy}%</div>
        <div className="text-xs text-blue-300/70">正确率</div>
      </div>
    </div>
  );
};
