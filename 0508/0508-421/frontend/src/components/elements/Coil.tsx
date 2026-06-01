import React from 'react';

interface CoilProps {
  cellSize: number;
  stroke: string;
  variable: string;
}

export const Coil: React.FC<CoilProps> = ({ cellSize, stroke, variable }) => {
  const centerX = cellSize / 2;
  const centerY = cellSize / 2;
  const circleRadius = cellSize * 0.25;
  const lineLength = cellSize * 0.2;

  return (
    <g>
      <line
        x1={centerX - circleRadius - lineLength}
        y1={centerY}
        x2={centerX - circleRadius}
        y2={centerY}
        stroke={stroke}
        strokeWidth={2}
      />
      <line
        x1={centerX + circleRadius}
        y1={centerY}
        x2={centerX + circleRadius + lineLength}
        y2={centerY}
        stroke={stroke}
        strokeWidth={2}
      />
      <circle
        cx={centerX}
        cy={centerY}
        r={circleRadius}
        fill="none"
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
