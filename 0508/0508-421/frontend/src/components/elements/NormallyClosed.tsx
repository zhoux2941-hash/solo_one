import React from 'react';

interface NormallyClosedProps {
  cellSize: number;
  stroke: string;
  variable: string;
}

export const NormallyClosed: React.FC<NormallyClosedProps> = ({ cellSize, stroke, variable }) => {
  const centerX = cellSize / 2;
  const centerY = cellSize / 2;
  const lineLength = cellSize * 0.6;
  const contactGap = cellSize * 0.15;

  return (
    <g>
      <line
        x1={centerX - contactGap - lineLength / 2}
        y1={centerY}
        x2={centerX - contactGap + lineLength / 2}
        y2={centerY}
        stroke={stroke}
        strokeWidth={2}
      />
      <line
        x1={centerX + contactGap - lineLength / 2}
        y1={centerY}
        x2={centerX + contactGap + lineLength / 2}
        y2={centerY}
        stroke={stroke}
        strokeWidth={2}
      />
      <line
        x1={centerX - contactGap - 5}
        y1={centerY - 15}
        x2={centerX + contactGap - 5}
        y2={centerY + 15}
        stroke={stroke}
        strokeWidth={2}
      />
      <line
        x1={centerX - contactGap + 5}
        y1={centerY - 15}
        x2={centerX + contactGap + 5}
        y2={centerY + 15}
        stroke={stroke}
        strokeWidth={2}
      />
      <line
        x1={centerX + contactGap - 15}
        y1={centerY - 22}
        x2={centerX + contactGap + 12}
        y2={centerY + 18}
        stroke={stroke}
        strokeWidth={2}
      />
      <text
        x={centerX}
        y={cellSize - 8}
        textAnchor="middle"
        fill={stroke}
        fontSize="12"
        fontFamily="monospace"
      >
        {variable}
      </text>
    </g>
  );
};
