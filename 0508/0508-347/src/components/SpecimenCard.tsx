import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Specimen } from '../../shared/types';
import StatusBadge from './StatusBadge';
import { positionsMatch } from '../utils/format';

interface SpecimenCardProps {
  specimen: Specimen;
  isDragging?: boolean;
  showOriginalPosition?: boolean;
}

export default function SpecimenCard({
  specimen,
  isDragging = false,
  showOriginalPosition = true,
}: SpecimenCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSorting } =
    useSortable({
      id: specimen.id,
      data: specimen,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isPositionCorrect = specimen.currentPosition
    ? positionsMatch(specimen.currentPosition, specimen.originalPosition)
    : false;

  const hasDiff = specimen.currentPosition && !isPositionCorrect;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative p-3 bg-white rounded-lg border-2 transition-all duration-200 cursor-grab active:cursor-grabbing
        ${isDragging || isSorting ? 'opacity-50 scale-105 shadow-xl z-50' : 'shadow-md'}
        ${hasDiff ? 'border-amber-400 animate-diff-flash' : isPositionCorrect ? 'border-forest-400' : 'border-museum-200'}
        hover:shadow-lg hover:border-museum-400
      `}
    >
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="mt-1 p-1 hover:bg-museum-100 rounded transition-colors"
        >
          <GripVertical className="w-4 h-4 text-museum-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium text-sm text-museum-900 truncate">
              {specimen.name}
            </h4>
            {isPositionCorrect && (
              <CheckCircle2 className="w-4 h-4 text-forest-500 flex-shrink-0" />
            )}
            {hasDiff && (
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-museum-500 mt-0.5">{specimen.code}</p>
          <p className="text-xs text-museum-400">{specimen.category}</p>

          <div className="mt-2 flex items-center justify-between">
            <StatusBadge type="specimen" status={specimen.status} />
            {showOriginalPosition && (
              <span className="text-xs text-museum-500">
                原: {specimen.originalPosition.row}-{specimen.originalPosition.col}
              </span>
            )}
          </div>
        </div>
      </div>

      {hasDiff && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
      )}
    </div>
  );
}
