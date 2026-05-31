import { useGameStore } from '../store/gameStore';
import type { DecisionOption } from '../types/game';

export default function DecisionOptions() {
  const { currentOptions, gameStatus, makeDecision } = useGameStore();

  const handleClick = (option: DecisionOption) => {
    if (gameStatus === 'ended') return;
    makeDecision(option);
  };

  const getPowerColor = (power: number) => {
    if (power >= 1.2) return 'text-victory-gold';
    if (power >= 1.0) return 'text-ancient-gold';
    return 'text-ancient-yellow';
  };

  return (
    <div className="bg-ancient-slate/90 backdrop-blur-sm rounded-lg border-2 border-ancient-gold/50 p-6 shadow-2xl animate-fadeIn">
      <h2 className="text-2xl font-bold text-ancient-gold font-serif mb-6 text-center">
        战略决策
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {currentOptions.map((option, index) => (
          <button
            key={option.id}
            onClick={() => handleClick(option)}
            disabled={gameStatus === 'ended'}
            className={`
              group relative p-5 rounded-lg border-2 text-left
              bg-gradient-to-b from-ancient-brown/40 to-ancient-slate/60
              border-ancient-gold/40
              transition-all duration-300 ease-out
              hover:scale-105 hover:border-ancient-gold hover:shadow-lg
              hover:shadow-ancient-gold/30
              active:scale-95 active:shadow-inner
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
              animate-slideUp
            `}
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg bg-gradient-to-t from-ancient-gold/10 to-transparent pointer-events-none" />
            
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-ancient-gold/60 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-ancient-gold/60 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-ancient-gold/60 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-ancient-gold/60 rounded-br-lg" />

            <div className="relative">
              <div className="text-4xl mb-3">{option.icon}</div>
              <h3 className="text-xl font-bold text-ancient-gold font-serif mb-2">
                {option.name}
              </h3>
              <p className="text-sm text-ancient-yellow/90 mb-4 leading-relaxed">
                {option.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-ancient-yellow/70">战力系数</span>
                <span className={`text-lg font-bold font-serif ${getPowerColor(option.strategyPower)}`}>
                  ×{option.strategyPower.toFixed(1)}
                </span>
              </div>
              <div className="mt-2 w-full h-2 bg-ancient-slate/60 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(option.strategyPower / 1.5) * 100}%`,
                    background: option.strategyPower >= 1.2
                      ? 'linear-gradient(90deg, #FFD700, #D4AF37)'
                      : option.strategyPower >= 1.0
                      ? 'linear-gradient(90deg, #D4AF37, #C4A35A)'
                      : 'linear-gradient(90deg, #C4A35A, #8B7355)',
                  }}
                />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
