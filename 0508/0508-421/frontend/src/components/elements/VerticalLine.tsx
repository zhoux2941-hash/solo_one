import React from 'react';

interface VerticalLineProps {
  cellSize: number;
  stroke: string;
}

export const VerticalLine: React.FC<VerticalLineProps> = ({ cellSize, stroke }) => {
  const centerX = cellSize / 2;

  return (
    <line
      x1={centerX}
      y1={0}
      x2={centerX}
      y2={cellSize}
      stroke={stroke}
      strokeWidth={2}
    />
  );
};
