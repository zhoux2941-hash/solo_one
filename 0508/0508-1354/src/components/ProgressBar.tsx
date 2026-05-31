interface ProgressBarProps {
  value: number;
  max: number;
  color: string;
  label: string;
  showValue?: boolean;
}

export default function ProgressBar({ value, max, color, label, showValue = true }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-ancient-yellow font-serif">{label}</span>
        {showValue && (
          <span className="text-sm text-ancient-gold font-medium">
            {Math.round(value)} / {max}
          </span>
        )}
      </div>
      <div className="relative w-full h-4 bg-ancient-slate/60 rounded-full overflow-hidden border border-ancient-gold/30">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${color} 0%, ${color}dd 50%, ${color}aa 100%)`,
            boxShadow: `0 0 10px ${color}66, inset 0 1px 2px rgba(255,255,255,0.3)`,
          }}
        />
        <div
          className="absolute top-0 left-0 h-full opacity-30"
          style={{
            width: `${percentage}%`,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)',
          }}
        />
      </div>
      {!showValue && (
        <div className="text-right mt-1">
          <span className="text-xs text-ancient-gold/80">{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  );
}
