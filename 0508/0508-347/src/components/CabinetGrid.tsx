import { useDroppable } from '@dnd-kit/core';
import type { Specimen } from '../../shared/types';
import SpecimenCard from './SpecimenCard';
import { positionsMatch } from '../utils/format';

interface CabinetSlotProps {
  row: number;
  col: number;
  specimen?: Specimen;
  expectedSpecimen?: Specimen;
  isHighlighted?: boolean;
}

function CabinetSlot({ row, col, specimen, expectedSpecimen, isHighlighted }: CabinetSlotProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${row}-${col}`,
    data: { row, col },
  });

  const isOriginalPosition =
    expectedSpecimen && positionsMatch({ row, col }, expectedSpecimen.originalPosition);

  return (
    <div
      ref={setNodeRef}
      className={`
        relative min-h-[120px] p-2 rounded-lg border-2 transition-all duration-200
        ${isOver ? 'border-museum-500 bg-museum-100 scale-[1.02]' : 'border-museum-200 bg-museum-50'}
        ${isHighlighted ? 'border-amber-400 bg-amber-50' : ''}
        ${isOriginalPosition && !specimen ? 'border-dashed border-forest-400 bg-forest-50' : ''}
      `}
    >
      <div className="absolute top-1 left-2 text-xs font-mono text-museum-400">
        {row}-{col}
      </div>

      {specimen ? (
        <SpecimenCard specimen={specimen} showOriginalPosition={false} />
      ) : (
        isOriginalPosition && (
          <div className="mt-4 p-2 text-center">
            <p className="text-xs text-forest-600 font-medium">
              {expectedSpecimen?.name}
            </p>
            <p className="text-xs text-forest-500">期望位置</p>
          </div>
        )
      )}

      {isOver && (
        <div className="absolute inset-0 border-2 border-dashed border-museum-500 rounded-lg pointer-events-none"></div>
      )}
    </div>
  );
}

interface CabinetGridProps {
  cabinet: {
    id: string;
    name: string;
    rows: number;
    cols: number;
  };
  specimens: Specimen[];
}

export default function CabinetGrid({ cabinet, specimens }: CabinetGridProps) {
  const getSpecimenAtPosition = (row: number, col: number) => {
    return specimens.find(
      (s) => s.currentPosition?.row === row && s.currentPosition?.col === col
    );
  };

  const getExpectedSpecimenAtPosition = (row: number, col: number) => {
    return specimens.find(
      (s) => s.originalPosition.row === row && s.originalPosition.col === col
    );
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-museum-900">{cabinet.name}</h3>
          <p className="text-sm text-museum-500">
            {cabinet.rows} 行 × {cabinet.cols} 列 · 点击拖拽放置标本
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 border border-forest-400 border-dashed bg-forest-50 rounded"></div>
            <span className="text-museum-600">期望位置</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 border-2 border-forest-400 bg-white rounded"></div>
            <span className="text-museum-600">已正确放置</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 border-2 border-amber-400 bg-white rounded"></div>
            <span className="text-museum-600">位置差异</span>
          </div>
        </div>
      </div>

      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${cabinet.cols}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: cabinet.rows }).map((_, rowIndex) =>
          Array.from({ length: cabinet.cols }).map((_, colIndex) => {
            const row = rowIndex + 1;
            const col = colIndex + 1;
            const specimen = getSpecimenAtPosition(row, col);
            const expectedSpecimen = getExpectedSpecimenAtPosition(row, col);

            return (
              <CabinetSlot
                key={`${row}-${col}`}
                row={row}
                col={col}
                specimen={specimen}
                expectedSpecimen={expectedSpecimen}
                isHighlighted={false}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
