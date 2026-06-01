import { useAppStore } from '@/store/useAppStore';
import { ChessCell } from './ChessCell';
import { cn } from '@/utils/cn';

export function ChessBoard() {
  const { boardSize, currentBoard, conflictCells, currentAttemptCell, currentStepIndex, steps } = useAppStore();

  const isConflictCell = (row: number, col: number): boolean => {
    return conflictCells.some(([r, c]) => r === row && c === col);
  };

  const isCurrentAttempt = (row: number, col: number): boolean => {
    return currentAttemptCell !== null && currentAttemptCell[0] === row && currentAttemptCell[1] === col;
  };

  const hasQueen = (row: number, col: number): boolean => {
    return currentBoard[row] === col;
  };

  const getQueenAnimation = (row: number, col: number): 'place' | 'backtrack' | 'conflict' | 'none' => {
    if (currentStepIndex < 0 || currentStepIndex >= steps.length) return 'none';
    const step = steps[currentStepIndex];
    if (step.row === row && step.col === col) {
      if (step.action === 'conflict') return 'conflict';
      if (step.action === 'backtrack') return 'backtrack';
      if (step.action === 'place' && step.conflictCells.length === 0) return 'place';
    }
    return 'none';
  };

  const cellSize = Math.min(40, Math.floor(480 / boardSize));

  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          'grid gap-0.5 p-2',
          'bg-slate-800 rounded-xl shadow-2xl',
          'border-2 border-slate-700'
        )}
        style={{
          gridTemplateColumns: `repeat(${boardSize}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${boardSize}, ${cellSize}px)`,
        }}
      >
        {Array.from({ length: boardSize }).map((_, row) =>
          Array.from({ length: boardSize }).map((_, col) => (
            <ChessCell
              key={`${row}-${col}`}
              row={row}
              col={col}
              hasQueen={hasQueen(row, col)}
              isConflict={isConflictCell(row, col)}
              isCurrentAttempt={isCurrentAttempt(row, col)}
              isLight={(row + col) % 2 === 0}
              queenAnimation={getQueenAnimation(row, col)}
            />
          ))
        )}
      </div>

      <div className="mt-2 flex justify-center gap-1">
        {Array.from({ length: boardSize }).map((_, i) => (
          <span
            key={i}
            className="text-slate-400 text-xs font-mono text-center"
            style={{ width: `${cellSize}px` }}
          >
            {String.fromCharCode(65 + i)}
          </span>
        ))}
      </div>
    </div>
  );
}
