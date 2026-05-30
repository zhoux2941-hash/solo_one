import { useGameStore } from '@/store/gameStore';
import { Zap } from 'lucide-react';

export default function PowerIndicator() {
  const { drawStrength } = useGameStore();

  const getColor = () => {
    if (drawStrength < 30) return 'from-green-400 to-green-600';
    if (drawStrength < 60) return 'from-yellow-400 to-orange-500';
    return 'from-orange-500 to-red-600';
  };

  const getGlowColor = () => {
    if (drawStrength < 30) return 'shadow-green-500/50';
    if (drawStrength < 60) return 'shadow-yellow-500/50';
    return 'shadow-red-500/50';
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-2 border-amber-500/50 rounded-xl p-4 shadow-xl">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-5 h-5 text-amber-400" />
        <span className="text-amber-100 font-bold text-sm">拉弓力度</span>
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <div className="relative w-8 h-40 bg-slate-700 rounded-full overflow-hidden border-2 border-slate-600">
          <div
            className={`absolute bottom-0 w-full bg-gradient-to-t ${getColor()} transition-all duration-75 ${
              drawStrength > 0 ? `shadow-lg ${getGlowColor()}` : ''
            }`}
            style={{ height: `${drawStrength}%` }}
          />
          
          {[0, 25, 50, 75, 100].map((mark) => (
            <div
              key={mark}
              className="absolute w-full border-t border-slate-500/50"
              style={{ bottom: `${mark}%` }}
            />
          ))}
          
          <div
            className="absolute left-0 w-full text-xs text-center transition-all duration-75"
            style={{ bottom: `calc(${drawStrength}% - 12px)` }}
          >
            {drawStrength > 10 && (
              <span className="text-white font-bold drop-shadow-lg">
                {Math.round(drawStrength)}%
              </span>
            )}
          </div>
        </div>
        
        <div className="text-xs text-amber-400/70 text-center">
          {drawStrength < 30 && '轻拉'}
          {drawStrength >= 30 && drawStrength < 60 && '适中'}
          {drawStrength >= 60 && drawStrength < 85 && '发力'}
          {drawStrength >= 85 && '满弓！'}
        </div>
      </div>
    </div>
  );
}
