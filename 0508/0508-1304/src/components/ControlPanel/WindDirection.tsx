import { Wind as WindIcon } from 'lucide-react';
import { WindDirection as WindDir } from '../../engine/types';
import { WIND_DIRECTIONS, WIND_VECTORS } from '../../engine/constants';

interface WindDirectionProps {
  value: WindDir;
  onChange: (direction: WindDir) => void;
  disabled?: boolean;
}

const directionPositions: Record<WindDir, { top: string; left: string; transform?: string }> = {
  N: { top: '0%', left: '50%', transform: 'translateX(-50%)' },
  NE: { top: '15%', left: '85%', transform: 'translate(-50%, -50%)' },
  E: { top: '50%', left: '100%', transform: 'translate(-50%, -50%)' },
  SE: { top: '85%', left: '85%', transform: 'translate(-50%, -50%)' },
  S: { top: '100%', left: '50%', transform: 'translate(-50%, -50%)' },
  SW: { top: '85%', left: '15%', transform: 'translate(-50%, -50%)' },
  W: { top: '50%', left: '0%', transform: 'translate(-50%, -50%)' },
  NW: { top: '15%', left: '15%', transform: 'translate(-50%, -50%)' },
};

const rotationAngles: Record<WindDir, number> = {
  N: 0,
  NE: 45,
  E: 90,
  SE: 135,
  S: 180,
  SW: 225,
  W: 270,
  NW: 315,
};

export function WindDirection({ value, onChange, disabled = false }: WindDirectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <WindIcon className="w-4 h-4" />
          风向选择
        </label>
        <span className="text-sm font-mono text-emerald-400">
          {WIND_VECTORS[value].label}风
        </span>
      </div>

      <div className="relative w-full aspect-square max-w-48 mx-auto">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-600">
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-slate-900 to-slate-800" />
        </div>

        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-slate-500 font-bold">
          N
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-slate-500 font-bold">
          S
        </div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-bold">
          W
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-bold">
          E
        </div>

        {WIND_DIRECTIONS.map((dir) => {
          const pos = directionPositions[dir];
          const isSelected = dir === value;

          return (
            <button
              key={dir}
              onClick={() => !disabled && onChange(dir)}
              disabled={disabled}
              className={`absolute w-8 h-8 rounded-full flex items-center justify-center
                transition-all duration-200
                ${isSelected
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50 scale-110'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              style={{
                top: pos.top,
                left: pos.left,
                transform: pos.transform,
              }}
            >
              <WindIcon
                className="w-4 h-4"
                style={{ transform: `rotate(${rotationAngles[dir] + 180}deg)` }}
              />
            </button>
          );
        })}

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-500 flex items-center justify-center">
          <WindIcon
            className="w-3 h-3 text-emerald-400"
            style={{ transform: `rotate(${rotationAngles[value] + 180}deg)` }}
          />
        </div>
      </div>
    </div>
  );
}
