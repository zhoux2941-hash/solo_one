import { Queen } from './Queen';
import { cn } from '@/utils/cn';

interface ChessCellProps {
  row: number;
  col: number;
  hasQueen: boolean;
  isConflict: boolean;
  isCurrentAttempt: boolean;
  isLight: boolean;
  queenAnimation?: 'place' | 'backtrack' | 'conflict' | 'none';
}

export function ChessCell({
  hasQueen,
  isConflict,
  isCurrentAttempt,
  isLight,
  queenAnimation = 'none',
}: ChessCellProps) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center',
        'w-full h-full',
        'transition-all duration-200',
        isLight ? 'bg-slate-300' : 'bg-slate-600',
        isConflict && 'bg-red-500/80 animate-cell-conflict',
        isCurrentAttempt && !isConflict && !hasQueen && [
          'ring-2 ring-indigo-400 ring-inset',
          'bg-indigo-500/30',
          'animate-pulse',
        ],
        isCurrentAttempt && hasQueen && [
          'ring-2 ring-green-400 ring-inset',
          'bg-green-500/30',
        ]
      )}
    >
      {hasQueen && <Queen animate={queenAnimation} size="md" />}
    </div>
  );
}
