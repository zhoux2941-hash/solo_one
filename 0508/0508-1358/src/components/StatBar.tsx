import { getStatLabel } from '@/utils/petUtils';
import { SAD_THRESHOLD, HAPPY_THRESHOLD } from '@/types/pet';

interface StatBarProps {
  stat: 'hunger' | 'cleanliness' | 'happiness';
  value: number;
  icon: string;
  color: string;
}

const StatBar = ({ stat, value, icon, color }: StatBarProps) => {
  const label = getStatLabel(stat);
  
  const getBarColor = () => {
    if (value < SAD_THRESHOLD) return 'bg-red-500';
    if (value > HAPPY_THRESHOLD) return 'bg-green-500';
    return color;
  };
  
  const getTextColor = () => {
    if (value < SAD_THRESHOLD) return 'text-red-600';
    if (value > HAPPY_THRESHOLD) return 'text-green-600';
    return 'text-gray-700';
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-xs font-medium text-gray-700 pixel-text">{label}</span>
        </div>
        <span className={`text-sm font-bold pixel-text ${getTextColor()} ${value < SAD_THRESHOLD ? 'animate-pulse' : ''}`}>
          {value}/100
        </span>
      </div>
      <div className="relative h-6 bg-gray-200 rounded-sm border-2 border-gray-800 overflow-hidden">
        <div
          className={`h-full ${getBarColor()} transition-all duration-500 ease-out`}
          style={{ width: `${value}%` }}
        />
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-black/10"
              style={{ left: `${(i + 1) * 10}%` }}
            />
          ))}
        </div>
      </div>
      {value < SAD_THRESHOLD && (
        <p className="text-xs text-red-500 mt-1 pixel-text animate-pulse">
          ⚠️ 需要关注！
        </p>
      )}
    </div>
  );
};

export default StatBar;
