import { Sparkles } from 'lucide-react';

interface ValueDisplayProps {
  value: string;
  label?: string;
  highlight?: boolean;
}

export const ValueDisplay = ({ value, label, highlight }: ValueDisplayProps) => {
  return (
    <div className="relative">
      {label && (
        <span className="absolute -top-2 left-2 px-2 py-0.5 text-xs font-medium bg-amber-900/80 text-amber-200 rounded-full">
          {label}
        </span>
      )}
      <div className={`
        relative px-8 py-4 rounded-2xl
        bg-gradient-to-br from-amber-900/90 to-stone-900/90
        border-2 border-amber-600/50
        shadow-lg shadow-amber-900/30
        ${highlight ? 'animate-pulse ring-2 ring-amber-400 ring-offset-2 ring-offset-stone-900' : ''}
      `}>
        {highlight && (
          <Sparkles className="absolute top-2 right-2 w-5 h-5 text-amber-400 animate-bounce" />
        )}
        <div className="flex items-center justify-center gap-3">
          <span className="text-amber-300/70 text-lg">当前数值</span>
          <span className={`
            font-bold tracking-wider
            ${highlight ? 'text-amber-300 text-5xl' : 'text-amber-100 text-4xl'}
            transition-all duration-300
          `}>
            {value}
          </span>
        </div>
      </div>
    </div>
  );
};
