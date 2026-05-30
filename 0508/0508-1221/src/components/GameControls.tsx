import { useGameStore } from '@/store/gameStore';
import { RotateCcw, Lightbulb, Eye, Check, ChevronLeft, ChevronRight } from 'lucide-react';

export default function GameControls() {
  const currentProblem = useGameStore(state => state.currentProblem);
  const gameStatus = useGameStore(state => state.gameStatus);
  const showHints = useGameStore(state => state.showHints);
  const showAnswer = useGameStore(state => state.showAnswer);
  const playerMoves = useGameStore(state => state.playerMoves);

  const resetBoard = useGameStore(state => state.resetBoard);
  const checkAnswer = useGameStore(state => state.checkAnswer);
  const toggleHints = useGameStore(state => state.toggleHints);
  const toggleAnswer = useGameStore(state => state.toggleAnswer);
  const goToNextProblem = useGameStore(state => state.goToNextProblem);
  const goToPrevProblem = useGameStore(state => state.goToPrevProblem);

  if (!currentProblem) return null;

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      <h3 className="text-lg font-serif font-bold text-white mb-4">操作</h3>

      {gameStatus !== 'playing' && (
        <div className={`mb-4 p-4 rounded-lg text-center font-bold ${
          gameStatus === 'correct'
            ? 'bg-accent-green/20 text-accent-green border border-accent-green/30'
            : 'bg-accent-red/20 text-accent-red border border-accent-red/30'
        }`}>
          {gameStatus === 'correct' ? '🎉 正解！' : '❌ 失败，再试试！'}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={checkAnswer}
          disabled={playerMoves.length === 0 || gameStatus !== 'playing'}
          className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-accent-red hover:bg-accent-red/90 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-medium rounded-lg btn-hover transition-all"
        >
          <Check className="w-5 h-5" />
          提交答案
        </button>

        <button
          onClick={toggleHints}
          disabled={gameStatus !== 'playing'}
          className={`flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-lg btn-hover transition-all ${
            showHints
              ? 'bg-accent-green text-white'
              : 'bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          <Lightbulb className="w-5 h-5" />
          {showHints ? '隐藏提示' : '显示提示'}
        </button>

        <button
          onClick={toggleAnswer}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg btn-hover transition-all"
        >
          <Eye className="w-5 h-5" />
          {showAnswer ? '隐藏答案' : '查看答案'}
        </button>

        <button
          onClick={resetBoard}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg btn-hover transition-all"
        >
          <RotateCcw className="w-5 h-5" />
          重置
        </button>

        {gameStatus === 'correct' && (
          <button
            onClick={goToNextProblem}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-accent-green hover:bg-accent-green/90 text-white font-medium rounded-lg btn-hover transition-all"
          >
            下一题
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
        <button
          onClick={goToPrevProblem}
          className="flex items-center gap-1 px-3 py-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          上一题
        </button>
        <span className="text-white/40 text-sm">
          {playerMoves.length > 0 ? `已落子 ${playerMoves.length} 手` : '点击棋盘落子'}
        </span>
        <button
          onClick={goToNextProblem}
          className="flex items-center gap-1 px-3 py-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
        >
          下一题
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
