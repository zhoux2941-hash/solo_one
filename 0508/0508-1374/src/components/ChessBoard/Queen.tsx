import { Crown } from 'lucide-react';
import { cn } from '@/utils/cn';

interface QueenProps {
  animate?: 'place' | 'backtrack' | 'conflict' | 'none';
  size?: 'sm' | 'md' | 'lg';
}

export function Queen({ animate = 'none', size = 'md' }: QueenProps) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const animationClasses = {
    place: 'animate-queen-place',
    backtrack: 'animate-queen-backtrack',
    conflict: 'animate-queen-conflict',
    none: '',
  };

  return (
    <div className={cn(
      'relative flex items-center justify-center',
      sizeClasses[size],
      animationClasses[animate]
    )}>
      <Crown
        className={cn(
          'w-full h-full drop-shadow-lg',
          'text-yellow-400',
          'filter brightness-110'
        )}
        fill="currentColor"
      />
      <div className="absolute inset-0 bg-yellow-400/20 blur-md rounded-full" />
    </div>
  );
}
