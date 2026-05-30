import React from 'react';
import type { Disk as DiskType } from '../../types/hanoi';

interface DiskProps {
  disk: DiskType;
  totalDisks: number;
  isDragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  isTop?: boolean;
}

export const Disk: React.FC<DiskProps> = ({
  disk,
  totalDisks,
  isDragging,
  onDragStart,
  onDragEnd,
  isTop
}) => {
  const baseWidth = 40;
  const widthIncrement = 24;
  const width = baseWidth + (disk.size - 1) * widthIncrement;
  const maxWidth = baseWidth + (totalDisks - 1) * widthIncrement;
  const leftOffset = (maxWidth - width) / 2;

  const handleDragStart = (e: React.DragEvent) => {
    if (!isTop) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('diskId', disk.id.toString());
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.();
  };

  return (
    <div
      draggable={isTop}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      className={`
        h-6 rounded-md shadow-lg transition-all duration-300
        ${isTop ? 'cursor-grab active:cursor-grabbing hover:brightness-110' : 'cursor-not-allowed opacity-90'}
        ${isDragging ? 'opacity-50 scale-105' : ''}
      `}
      style={{
        width: `${width}px`,
        marginLeft: `${leftOffset}px`,
        backgroundColor: disk.color,
        boxShadow: `0 4px 12px ${disk.color}40, inset 0 2px 4px rgba(255,255,255,0.3)`
      }}
    >
      <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold drop-shadow-md">
        {disk.size}
      </div>
    </div>
  );
};
