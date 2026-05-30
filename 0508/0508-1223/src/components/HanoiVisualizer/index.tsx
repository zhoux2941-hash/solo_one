import React, { useState } from 'react';
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
