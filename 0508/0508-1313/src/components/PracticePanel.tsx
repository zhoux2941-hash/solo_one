import { CheckCircle, XCircle, Play, Trophy } from 'lucide-react';
import type { PracticeProblem } from '../types';
import { practiceProblems } from '../data/practiceProblems';

interface PracticePanelProps {
  currentProblemId: number | null;
  completedProblems: number[];
  onSelectProblem: (problem: PracticeProblem) => void;
  onSubmitAnswer: (answer: number) => void;
  currentValue: number;
  score: number;
  accuracy: number;
  onResetScore: () => void;
  disabled?: boolean;
}

export const PracticePanel = ({
  currentProblemId,
  completedProblems,
  onSelectProblem,
  onSubmitAnswer,
  currentValue,
  score,
  accuracy,
  onResetScore,
  disabled,
}: PracticePanelProps) => {
  const currentProblem = practiceProblems.find(p => p.id === currentProblemId);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-900/50 text-green-300 border-green-700/50';
      case 'medium': return 'bg-yellow-900/50 text-yellow-300 border-yellow-700/50';
      case 'hard': return 'bg-red-900/50 text-red-300 border-red-700/50';
      default: return 'bg-stone-700/50 text-stone-300 border-stone-600/50';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return difficulty;
    }
  };

  const handleSubmit = () => {
    if (!currentProblem || disabled) return;
    onSubmitAnswer(currentValue);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-amber-200 font-semibold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          练习模式
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-amber-300/70">
          得分: <span className="font-bold text-amber-300">{score}</span>
          </span>
          <span className="text-sm text-amber-300/70">
          正确率: <span className="font-bold text-amber-300">{accuracy}%</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {practiceProblems.map((problem) => {
          const isCompleted = completedProblems.includes(problem.id);
          const isActive = currentProblemId === problem.id;

          return (
            <button
              key={problem.id}
              onClick={() => onSelectProblem(problem)}
              disabled={disabled}
              className={`
                relative p-3 rounded-xl border-2 transition-all ${
                isActive
                  ? 'bg-amber-700/50 border-amber-500 scale-105'
                  : isCompleted
                  ? 'bg-stone-700/30 border-stone-600/50 opacity-60'
                  : 'bg-stone-800/50 border-stone-700/50 hover:bg-stone-700/50 hover:border-stone-600/50'
              } disabled:cursor-not-allowed
            `}
            >
              {isCompleted && (
                <CheckCircle className="absolute top-1 right-1 w-4 h-4 text-green-400" />
              )}
              <div className="text-lg font-bold text-amber-100">
                {problem.question}
              </div>
              <div className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 border ${getDifficultyColor(problem.difficulty)}`}>
                {getDifficultyLabel(problem.difficulty)}
              </div>
            </button>
          );
        })}
      </div>

      {currentProblem && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-900/50 to-stone-800/50 border border-amber-700/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-amber-300/70">当前题目</div>
              <div className="text-3xl font-bold text-amber-100 mt-1">
                {currentProblem.question}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-amber-300/70">当前算盘数值</div>
              <div className="text-2xl font-bold text-amber-300 mt-1">{currentValue}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={disabled}
              className="flex-1 py-3 rounded-xl bg-green-700 hover:bg-green-600 text-white font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5" />
              提交答案
            </button>
            <button
              onClick={onResetScore}
              className="px-4 py-3 rounded-xl bg-stone-700/70 hover:bg-stone-600/70 text-amber-200 font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={disabled}
            >
              重置分数
            </button>
          </div>
        </div>
      )}

      {!currentProblem && (
        <div className="p-6 rounded-xl bg-stone-800/30 border border-stone-700/30 text-center">
          <div className="text-amber-300/50">选择一道练习题开始</div>
        </div>
      )}
    </div>
  );
};
