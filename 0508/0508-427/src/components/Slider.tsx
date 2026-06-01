import React from 'react';
import { cn } from '@/lib/utils';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
  color?: string;
  icon?: React.ReactNode;
}

export default function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  color = '#64ffda',
  icon,
}: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-sm opacity-70">{icon}</span>}
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {label}
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span
            className="text-lg font-bold font-display transition-all duration-200"
            style={{ color }}
          >
            {value < 1 ? value.toFixed(2) : value < 10 ? value.toFixed(1) : value.toFixed(0)}
          </span>
          <span className="text-xs text-slate-500">{unit}</span>
        </div>
      </div>
      <div className="relative">
        <div className="absolute top-1/2 left-0 h-[6px] rounded-l-full -translate-y-1/2 pointer-events-none" style={{
          width: `${percent}%`,
          background: `linear-gradient(to right, ${color}44, ${color}88)`,
        }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="relative z-10 w-full"
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-600">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
}
