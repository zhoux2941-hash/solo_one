import React from 'react';
import { FoodOption } from '../types/game';

interface FoodSelectorProps {
  options: FoodOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

const FoodSelector: React.FC<FoodSelectorProps> = ({ options, selectedId, onSelect, disabled }) => {
  const getRiskColor = (probability: number) => {
    if (probability <= 0.1) return 'text-emerald-400';
    if (probability <= 0.2) return 'text-amber-400';
    return 'text-red-400';
  };

  const getRiskLabel = (probability: number) => {
    if (probability <= 0.1) return '低风险';
    if (probability <= 0.2) return '中风险';
    return '高风险';
  };

  return (
    <div className="game-panel p-6 animate-slide-up">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="text-2xl">🍽️</span> 选择食物来源
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {options.map((food, index) => (
          <div
            key={food.id}
            className={`food-card ${selectedId === food.id ? 'selected' : ''} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
            onClick={() => !disabled && onSelect(food.id)}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="text-center mb-3">
              <span className="text-5xl block mb-2">{food.icon}</span>
              <h3 className="text-lg font-bold text-white">{food.name}</h3>
            </div>
            
            <p className="text-white/60 text-sm mb-4 text-center leading-relaxed">
              {food.description}
            </p>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">饱腹度</span>
                <span className="text-emerald-400 font-medium">
                  +{food.satiety.min}~{food.satiety.max}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">风险</span>
                <span className={`font-medium ${getRiskColor(food.healthRisk.probability)}`}>
                  {getRiskLabel(food.healthRisk.probability)} ({Math.round(food.healthRisk.probability * 100)}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">耗时</span>
                <span className="text-survival-orange font-medium">
                  {food.timeCost} 小时
                </span>
              </div>
            </div>
            
            {selectedId === food.id && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-survival-orange rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FoodSelector;
