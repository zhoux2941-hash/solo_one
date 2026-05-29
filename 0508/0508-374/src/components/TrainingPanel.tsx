import { useState, useEffect, useCallback } from 'react';
import type { TrainingState } from '@/types';

interface TrainingPanelProps {
  state: TrainingState;
  onStart: () => void;
  onAnswer: (answer: string) => void;
  onPlay: () => void;
  isPlaying: boolean;
}

export function TrainingPanel({ state, onStart, onAnswer, onPlay, isPlaying }: TrainingPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    setInputValue('');
    if (state.lastResult) {
      setShowResult(true);
      const timer = setTimeout(() => setShowResult(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [state.currentChar, state.lastResult]);

  const handleSubmit = useCallback(() => {
    if (inputValue.trim()) {
      onAnswer(inputValue.trim());
    }
  }, [inputValue, onAnswer]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && state.lastResult === null && inputValue.trim()) {
      handleSubmit();
    }
  }, [state.lastResult, inputValue, handleSubmit]);

  return (
    <div className="bg-morse-bg/50 rounded-xl p-6 border border-morse-primary/10">
      <div className="text-center mb-6">
        <h2 className="text-xl font-display font-bold text-morse-text mb-2">训练模式</h2>
        <p className="text-sm text-morse-text/60">听摩尔斯电码，输入对应的字符</p>
      </div>

      {!state.currentChar ? (
        <div className="text-center py-12">
          <button
            onClick={onStart}
            className="px-8 py-4 bg-morse-primary text-morse-bg font-display font-bold text-lg rounded-xl hover:bg-morse-primary/90 transition-all duration-200 transform hover:scale-105"
          >
            🚀 开始训练
          </button>
        </div>
      ) : (
        <>
          <div className="bg-morse-bg/50 rounded-xl p-8 mb-6">
            <div className="text-center">
              <div className={`text-6xl font-mono mb-4 ${
                showResult && state.lastResult === 'correct' ? 'text-morse-primary animate-pulse' :
                showResult && state.lastResult === 'wrong' ? 'text-morse-error' :
                'text-morse-text/50'
              }`}>
                {showResult ? state.currentChar : '?'}
              </div>
              <div className="text-morse-secondary font-mono text-lg">
                {state.currentMorse}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mb-6">
            <button
              onClick={onPlay}
              disabled={isPlaying}
              className="flex-1 px-4 py-3 bg-morse-primary/20 text-morse-primary font-medium rounded-lg border border-morse-primary/50 hover:bg-morse-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPlaying ? '⏳ 播放中...' : '🔊 播放'}
            </button>
            <button
              onClick={onStart}
              className="px-4 py-3 bg-morse-secondary/20 text-morse-secondary font-medium rounded-lg border border-morse-secondary/50 hover:bg-morse-secondary/30 transition-colors"
            >
              ➡ 下一个
            </button>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              placeholder="输入答案..."
              maxLength={1}
              disabled={state.lastResult !== null}
              className={`flex-1 px-4 py-3 bg-morse-bg/50 border rounded-lg font-mono text-xl text-center focus:outline-none transition-colors ${
                showResult && state.lastResult === 'correct'
                  ? 'border-morse-primary text-morse-primary'
                  : showResult && state.lastResult === 'wrong'
                  ? 'border-morse-error text-morse-error'
                  : 'border-morse-primary/20 text-morse-text focus:border-morse-primary/50'
              }`}
              autoFocus
            />
            <button
              onClick={handleSubmit}
              disabled={!inputValue.trim() || state.lastResult !== null}
              className="px-6 py-3 bg-morse-primary text-morse-bg font-medium rounded-lg hover:bg-morse-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              确认
            </button>
          </div>

          {showResult && (
            <div className={`mt-4 text-center py-3 rounded-lg ${
              state.lastResult === 'correct' ? 'bg-morse-primary/20 text-morse-primary' : 'bg-morse-error/20 text-morse-error'
            }`}>
              {state.lastResult === 'correct' ? '✅ 正确!' : `❌ 错误! 正确答案是 ${state.currentChar}`}
            </div>
          )}
        </>
      )}
    </div>
  );
}
