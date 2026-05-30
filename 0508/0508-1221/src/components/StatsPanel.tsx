import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Clock, RefreshCw, Trophy, Target } from 'lucide-react';

export default function StatsPanel() {
  const elapsedTime = useGameStore(state => state.elapsedTime);
  const attempts = useGameStore(state => state.attempts);
  const gameStatus = useGameStore(state => state.gameStatus);
  const currentProblem = useGameStore(state => state.currentProblem);
  const progress = useGameStore(state => state.progress);
  const incrementTime = useGameStore(state => state.incrementTime);

  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const timer = setInterval(() => {
      incrementTime();
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus, incrementTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentProgress = currentProblem ? progress[currentProblem.id] : null;
  const solvedCount = Object.values(progress).filter(p => p.solved).length;
  const totalProblems = 50;

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      <h3 className="text-lg font-serif font-bold text-white mb-4">统计</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
            <Clock className="w-4 h-4" />
            用时
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {formatTime(elapsedTime)}
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
            <RefreshCw className="w-4 h-4" />
            尝试次数
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {attempts}
          </div>
        </div>
      </div>

      {currentProgress && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">历史最佳</span>
            <span className="text-white font-mono">
              {currentProgress.bestTime < Infinity ? formatTime(currentProgress.bestTime) : '--:--'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-white/60">总尝试</span>
            <span className="text-white font-mono">{currentProgress.attempts} 次</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-white/60">状态</span>
            <span className={`font-medium ${currentProgress.solved ? 'text-accent-green' : 'text-white/60'}`}>
              {currentProgress.solved ? '✓ 已完成' : '未完成'}
            </span>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span className="text-white/60 text-sm">总体进度</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-green to-accent-green/70 transition-all duration-500"
              style={{ width: `${(solvedCount / totalProblems) * 100}%` }}
            />
          </div>
          <span className="text-white font-mono text-sm">
            {solvedCount}/{totalProblems}
          </span>
        </div>
      </div>
    </div>
  );
}
