import React from 'react';

interface BusBarProps {
  cellSize: number;
  position: 'left' | 'right';
}

export const BusBar: React.FC<BusBarProps> = ({ cellSize, position }) => {
  const x = position === 'left' ? 2 : cellSize - 2;

  return (
    <line
      x1={x}
      y1={0}
      x2={x}
      y2={cellSize}
      stroke="#333"
      strokeWidth={4}
    />
  );
};
