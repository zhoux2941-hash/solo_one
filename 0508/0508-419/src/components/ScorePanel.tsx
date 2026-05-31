import { useGameStore } from '@/store/gameStore';
import { SCORE_CONFIG } from '@/constants/game';
import { Zap, Trophy, Target } from 'lucide-react';

export default function ScorePanel() {
  const { score, combo, maxCombo } = useGameStore();
  const hasMultiplier = combo >= SCORE_CONFIG.comboMultiplierThreshold;

  return (
    <div className="flex flex-col gap-6 w-full max-w-xs">
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
        <div className="flex items-center gap-3 mb-2">
          <Target className="w-5 h-5 text-cyan-400" />
          <span className="text-slate-400 text-sm uppercase tracking-wider">Score</span>
        </div>
        <div
          className="font-bold text-cyan-400 transition-all duration-200"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: hasMultiplier ? '3rem' : '2.5rem',
            textShadow: hasMultiplier ? '0 0 20px rgba(6, 182, 212, 0.6)' : 'none',
          }}
        >
          {score.toLocaleString()}
        </div>
        {hasMultiplier && (
          <div className="mt-2 flex items-center gap-2">
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded animate-pulse">
              ×{SCORE_CONFIG.comboMultiplier} MULTIPLIER
            </span>
          </div>
        )}
      </div>

      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-5 h-5 text-purple-400" />
          <span className="text-slate-400 text-sm uppercase tracking-wider">Combo</span>
        </div>
        <div
          className="font-bold text-purple-400 transition-all duration-150"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: combo >= 10 ? '2.5rem' : '2rem',
            transform: combo >= 10 ? 'scale(1.1)' : 'scale(1)',
            textShadow:
              combo >= 10
                ? '0 0 30px rgba(168, 85, 247, 0.8)'
                : '0 0 10px rgba(168, 85, 247, 0.3)',
          }}
        >
          {combo}
        </div>
        {combo > 0 && (
          <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-200"
              style={{
                width: `${Math.min((combo / SCORE_CONFIG.comboMultiplierThreshold) * 100, 100)}%`,
              }}
            />
          </div>
        )}
      </div>

      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <span className="text-slate-400 text-sm uppercase tracking-wider">Max Combo</span>
        </div>
        <div
          className="font-bold text-yellow-400"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '1.75rem',
            textShadow: '0 0 15px rgba(234, 179, 8, 0.4)',
          }}
        >
          {maxCombo}
        </div>
      </div>
    </div>
  );
}
