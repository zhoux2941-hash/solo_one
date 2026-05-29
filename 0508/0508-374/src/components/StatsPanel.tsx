interface StatsPanelProps {
  score: number;
  total: number;
  correct: number;
  wrong: number;
  successRate: number;
  streak: number;
  onReset: () => void;
}

export function StatsPanel({ score, total, correct, wrong, successRate, streak, onReset }: StatsPanelProps) {
  return (
    <div className="bg-morse-bg/50 rounded-xl p-6 border border-morse-primary/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-morse-text/70">训练统计</h3>
        {total > 0 && (
          <button
            onClick={onReset}
            className="text-xs text-morse-error hover:text-morse-error/80 transition-colors"
          >
            重置统计
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-display font-bold text-morse-primary">{score}</div>
          <div className="text-xs text-morse-text/60">得分</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-display font-bold text-morse-secondary">{successRate}%</div>
          <div className="text-xs text-morse-text/60">成功率</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-display font-bold text-yellow-400">{streak}</div>
          <div className="text-xs text-morse-text/60">连续正确</div>
        </div>
      </div>
      
      {total > 0 && (
        <div className="mt-4 pt-4 border-t border-morse-primary/10">
          <div className="flex justify-between text-sm">
            <span className="text-morse-text/70">总题数</span>
            <span className="text-morse-text">{total}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-morse-primary">正确</span>
            <span className="text-morse-primary">{correct}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-morse-error">错误</span>
            <span className="text-morse-error">{wrong}</span>
          </div>
          
          <div className="mt-3">
            <div className="h-2 bg-morse-bg/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-morse-primary to-morse-secondary transition-all duration-500"
                style={{ width: `${successRate}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
