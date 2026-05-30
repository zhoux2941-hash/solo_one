
const fs = require('fs');
const path = require('path');

const files = {
  'src/components/HanoiVisualizer/Disk.tsx': `import React from 'react';
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
      className={
        'h-6 rounded-md shadow-lg transition-all duration-300 ' +
        (isTop ? 'cursor-grab active:cursor-grabbing hover:brightness-110' : 'cursor-not-allowed opacity-90') +
        (isDragging ? ' opacity-50 scale-105' : '')
      }
      style={{
        width: width + 'px',
        marginLeft: leftOffset + 'px',
        backgroundColor: disk.color,
        boxShadow: '0 4px 12px ' + disk.color + '40, inset 0 2px 4px rgba(255,255,255,0.3)'
      }}
    >
      <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold drop-shadow-md">
        {disk.size}
      </div>
    </div>
  );
};
`,

  'src/components/HanoiVisualizer/Rod.tsx': `import React, { useState } from 'react';
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
  const [isDragOver, setIsDragOver] = useState(false);

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
      className={
        'flex flex-col items-center transition-all duration-300 ' +
        ((isDropTarget || isDragOver) ? 'scale-105' : '')
      }
      style={{ width: maxWidth + 'px' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="text-slate-300 font-bold text-lg mb-2">
        {rodId}
      </div>

      <div
        className={
          'relative w-full flex flex-col-reverse items-center py-2 rounded-t-lg transition-all duration-300 ' +
          (isDragOver ? 'bg-slate-700/50 ring-2 ring-blue-400' : '')
        }
        style={{ minHeight: (totalDisks * 28 + 40) + 'px' }}
      >
        <div
          className="absolute top-0 w-3 rounded-t-lg bg-gradient-to-b from-amber-600 to-amber-800"
          style={{ height: (totalDisks * 28 + 20) + 'px' }}
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
        style={{ width: maxWidth + 'px' }}
      />
    </div>
  );
};
`,

  'src/components/HanoiVisualizer/index.tsx': `import React, { useState } from 'react';
import type { RodId } from '../../types/hanoi';
import { useHanoiStore } from '../../store/useHanoiStore';
import { Rod } from './Rod';

export const HanoiVisualizer: React.FC = () => {
  const { rods, diskCount, moveDisk, isPlaying } = useHanoiStore();
  const [draggingFrom, setDraggingFrom] = useState<RodId | null>(null);

  const handleDrop = (from: RodId, to: RodId) => {
    if (!isPlaying) {
      moveDisk(from, to);
    }
    setDraggingFrom(null);
  };

  return (
    <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-8 shadow-2xl">
      <div className="flex justify-center items-end gap-8 md:gap-16">
        {(['A', 'B', 'C'] as RodId[]).map((rodId) => (
          <Rod
            key={rodId}
            rodId={rodId}
            disks={rods[rodId]}
            totalDisks={diskCount}
            onDrop={handleDrop}
            draggingFrom={draggingFrom}
          />
        ))}
      </div>

      <div className="mt-6 text-center text-slate-400 text-sm">
        {isPlaying ? (
          <span className="text-blue-400">正在自动求解中...</span>
        ) : (
          <span>拖拽柱子顶部的盘子到其他柱子</span>
        )}
      </div>
    </div>
  );
};
`
};

for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filePath);
  const dirPath = path.dirname(fullPath);
  
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  fs.writeFileSync(fullPath, content, 'utf-8');
  console.log('Created:', filePath);
}

console.log('Done!');
