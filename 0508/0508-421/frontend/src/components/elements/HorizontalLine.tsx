import React from 'react';

interface HorizontalLineProps {
  cellSize: number;
  stroke: string;
}

export const HorizontalLine: React.FC<HorizontalLineProps> = ({ cellSize, stroke }) => {
  const centerY = cellSize / 2;

  return (
    <line
      x1={0}
      y1={centerY}
      x2={cellSize}
      y2={centerY}
      stroke={stroke}
      strokeWidth={2}
    />
  );
};
