import React from 'react';

interface TimerElementProps {
  cellSize: number;
  stroke: string;
  variable: string;
  value?: number;
}

export const TimerElement: React.FC<TimerElementProps> = ({ cellSize, stroke, variable, value }) => {
  const centerX = cellSize / 2;
  const centerY = cellSize / 2;
  const rectWidth = cellSize * 0.5;
  const rectHeight = cellSize * 0.35;
  const lineLength = cellSize * 0.15;

  return (
    <g>
      <line
        x1={centerX - rectWidth / 2 - lineLength}
        y1={centerY}
        x2={centerX - rectWidth / 2}
        y2={centerY}
        stroke={stroke}
        strokeWidth={2}
      />
      <line
        x1={centerX + rectWidth / 2}
        y1={centerY}
        x2={centerX + rectWidth / 2 + lineLength}
        y2={centerY}
        stroke={stroke}
        strokeWidth={2}
      />
      <rect
        x={centerX - rectWidth / 2}
        y={centerY - rectHeight / 2}
        width={rectWidth}
        height={rectHeight}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
      />
      <text
        x={centerX}
        y={centerY - 5}
        textAnchor="middle"
        fill={stroke}
        fontSize="12"
        fontFamily="monospace"
        fontWeight="bold"
      >
        TON
      </text>
      <polygon
        points={`${centerX - 8},${centerY + rectHeight / 2} ${centerX - 4},${centerY + rectHeight / 2 - 8} ${centerX},${centerY + rectHeight / 2}`}
        fill={stroke}
      />
      <polygon
        points={`${centerX},${centerY + rectHeight / 2} ${centerX + 4},${centerY + rectHeight / 2 - 8} ${centerX + 8},${centerY + rectHeight / 2}`}
        fill={stroke}
      />
      <text
        x={centerX}
        y={cellSize - 8}
        textAnchor="middle"
        fill={stroke}
        fontSize="11"
        fontFamily="monospace"
      >
        {variable} {value !== undefined ? `K${value}` : ''}
      </text>
    </g>
  );
};
