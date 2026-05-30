import { Scroll } from 'lucide-react';

interface FormulaDisplayProps {
  formula: string | null;
  description?: string;
}

export const FormulaDisplay = ({ formula, description }: FormulaDisplayProps) => {
  if (!formula) {
    return (
      <div className="flex flex-col items-center justify-center py-6 px-8 rounded-2xl bg-stone-900/50 border border-stone-700/50 min-h-[120px]">
        <Scroll className="w-8 h-8 text-stone-600 mb-2" />
        <span className="text-stone-500 text-sm">口诀将在此显示</span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-900/80 via-amber-800/60 to-amber-900/80 border-2 border-amber-600/50 shadow-xl">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
        <div className="absolute top-0 left-2 w-2 h-full bg-gradient-to-b from-transparent via-amber-400 to-transparent" />
        <div className="absolute top-0 right-2 w-2 h-full bg-gradient-to-b from-transparent via-amber-400 to-transparent" />
      </div>

      <div className="relative p-6 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-3">
          <Scroll className="w-5 h-5 text-amber-400" />
          <span className="text-amber-300/80 text-sm font-medium">珠算口诀</span>
        </div>

        <div className="relative">
          <span className="text-4xl font-bold text-amber-200 tracking-widest drop-shadow-lg">
            {formula}
          </span>
          <div className="absolute -inset-2 bg-amber-400/20 blur-xl -z-10 rounded-full" />
        </div>

        {description && (
          <p className="mt-3 text-amber-200/70 text-sm text-center max-w-xs">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};
