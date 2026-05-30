import React from 'react';
import type { Disk as DiskType, RodId } from '../../types/hanoi';
import { Disk } from './Disk';

interface RodProps {
  rodId: RodId;
  disks: DiskType[];
  totalDisks: number;
  isDropTarget?: boolean;
  onDrop: (fromRod: RodId, toRod: RodId) => void;
  draggingFrom?: RodId | null;
}

export const Rod: React.FC<RodProps> = ({
  rodId,
  disks,
  totalDisks,
  isDropTarget,
  onDrop,
  draggingFrom
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggingFrom !== rodId) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const diskId = e.dataTransfer.getData('diskId');
    if (diskId && draggingFrom && draggingFrom !== rodId) {
      onDrop(draggingFrom, rodId);
    }
  };

  const baseWidth = 40;
  const widthIncrement = 24;
  const maxWidth = baseWidth + (totalDisks - 1) * widthIncrement + 40;

  return (
    <div
      className={`
        flex flex-col items-center transition-all duration-300
        ${isDropTarget || isDragOver ? 'scale-105' : ''}
      `}
      style={{ width: `${maxWidth}px` }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="text-slate-300 font-bold text-lg mb-2">
        {rodId}
      </div>

      <div
        className={`
          relative w-full flex flex-col-reverse items-center py-2
          rounded-t-lg transition-all duration-300
          ${isDragOver ? 'bg-slate-700/50 ring-2 ring-blue-400' : ''}
        `}
        style={{ minHeight: `${totalDisks * 28 + 40}px` }}
      >
        <div
          className="absolute top-0 w-3 rounded-t-lg bg-gradient-to-b from-amber-600 to-amber-800"
          style={{ height: `${totalDisks * 28 + 20}px` }}
        />

        <div className="relative z-10 flex flex-col-reverse gap-0.5 w-full items-center">
          {disks.map((disk, index) => (
            <Disk
              key={disk.id}
              disk={disk}
              totalDisks={totalDisks}
              isTop={index === disks.length - 1}
            />
          ))}
        </div>
      </div>

      <div
        className="h-4 rounded-lg bg-gradient-to-b from-amber-700 to-amber-900 shadow-lg"
        style={{ width: `${maxWidth}px` }}
      />
    </div>
  );
};
