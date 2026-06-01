import { useAppStore } from '@/store/useAppStore';
import { MIN_SPEED, MAX_SPEED, DEFAULT_SPEED } from '@/constants';
import { Gauge, Zap, Turtle } from 'lucide-react';

export function SpeedSlider() {
  const { animationSpeed, setAnimationSpeed } = useAppStore();

  const displaySpeed = Math.round((MAX_SPEED - animationSpeed + MIN_SPEED) / 10);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Gauge className="w-4 h-4" />
          动画速度
        </label>
        <span className="text-sm text-indigo-400 font-mono">
          {displaySpeed}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Turtle className="w-4 h-4 text-slate-500" />
        <input
          type="range"
          min={MIN_SPEED}
          max={MAX_SPEED}
          value={animationSpeed}
          onChange={(e) => setAnimationSpeed(Number(e.target.value))}
          className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((MAX_SPEED - animationSpeed + MIN_SPEED) / (MAX_SPEED - MIN_SPEED)) * 100}%, #334155 ${((MAX_SPEED - animationSpeed + MIN_SPEED) / (MAX_SPEED - MIN_SPEED)) * 100}%, #334155 100%)`,
          }}
        />
        <Zap className="w-4 h-4 text-yellow-500" />
      </div>
    </div>
  );
}
