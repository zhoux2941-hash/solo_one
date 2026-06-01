import React from 'react';
import type { PlcElement } from '../types/plc';

interface PlcElementSvgProps {
  element: PlcElement;
  cellSize: number;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
}

export const PlcElementSvg: React.FC<PlcElementSvgProps> = ({
  element,
  cellSize,
  isSelected,
  onClick,
}) => {
  const cx = element.x * cellSize + cellSize / 2;
  const cy = element.y * cellSize * 1.5 + cellSize * 0.75;
  const halfSize = cellSize * 0.35;

  const strokeColor = element.state ? '#ef4444' : '#374151';
  const fillColor = element.state ? '#fecaca' : '#ffffff';
  const strokeWidth = isSelected ? 3 : 2;

  const renderElement = () => {
    switch (element.type) {
      case 'normally-open':
        return (
          <g>
            <line
              x1={cx - halfSize}
              y1={cy}
              x2={cx - halfSize * 0.3}
              y2={cy}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <line
              x1={cx + halfSize * 0.3}
              y1={cy}
              x2={cx + halfSize}
              y2={cy}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <line
              x1={cx - halfSize * 0.3}
              y1={cy - halfSize * 0.6}
              x2={cx + halfSize * 0.3}
              y2={cy + halfSize * 0.6}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <text
              x={cx}
              y={cy + halfSize * 0.9}
              textAnchor="middle"
              fontSize="12"
              fill="#374151"
            >
              {element.variable}
            </text>
          </g>
        );

      case 'normally-closed':
        return (
          <g>
            <line
              x1={cx - halfSize}
              y1={cy}
              x2={cx - halfSize * 0.3}
              y2={cy}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <line
              x1={cx + halfSize * 0.3}
              y1={cy}
              x2={cx + halfSize}
              y2={cy}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <line
              x1={cx - halfSize * 0.3}
              y1={cy - halfSize * 0.6}
              x2={cx + halfSize * 0.3}
              y2={cy + halfSize * 0.6}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <line
              x1={cx - halfSize * 0.5}
              y1={cy + halfSize * 0.3}
              x2={cx - halfSize * 0.15}
              y2={cy - halfSize * 0.3}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <text
              x={cx}
              y={cy + halfSize * 0.9}
              textAnchor="middle"
              fontSize="12"
              fill="#374151"
            >
              {element.variable}
            </text>
          </g>
        );

      case 'coil':
        return (
          <g>
            <line
              x1={cx - halfSize}
              y1={cy}
              x2={cx - halfSize * 0.6}
              y2={cy}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <line
              x1={cx + halfSize * 0.6}
              y1={cy}
              x2={cx + halfSize}
              y2={cy}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <circle
              cx={cx}
              cy={cy}
              r={halfSize * 0.6}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <text
              x={cx}
              y={cy + 4}
              textAnchor="middle"
              fontSize="11"
              fill="#374151"
            >
              {element.variable}
            </text>
          </g>
        );

      case 'timer':
        return (
          <g>
            <line
              x1={cx - halfSize}
              y1={cy}
              x2={cx - halfSize * 0.6}
              y2={cy}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <line
              x1={cx + halfSize * 0.6}
              y1={cy}
              x2={cx + halfSize}
              y2={cy}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <rect
              x={cx - halfSize * 0.6}
              y={cy - halfSize * 0.5}
              width={halfSize * 1.2}
              height={halfSize}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <text
              x={cx}
              y={cy - halfSize * 0.15}
              textAnchor="middle"
              fontSize="10"
              fill="#374151"
            >
              TON
            </text>
            <text
              x={cx}
              y={cy + halfSize * 0.35}
              textAnchor="middle"
              fontSize="10"
              fill="#374151"
            >
              {element.variable}
            </text>
            <text
              x={cx}
              y={cy + halfSize * 0.9}
              textAnchor="middle"
              fontSize="9"
              fill="#6b7280"
            >
              {element.value ?? 0}
            </text>
          </g>
        );

      case 'counter':
        return (
          <g>
            <line
              x1={cx - halfSize}
              y1={cy}
              x2={cx - halfSize * 0.6}
              y2={cy}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <line
              x1={cx + halfSize * 0.6}
              y1={cy}
              x2={cx + halfSize}
              y2={cy}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <rect
              x={cx - halfSize * 0.6}
              y={cy - halfSize * 0.5}
              width={halfSize * 1.2}
              height={halfSize}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <text
              x={cx}
              y={cy - halfSize * 0.15}
              textAnchor="middle"
              fontSize="10"
              fill="#374151"
            >
              CTN
            </text>
            <text
              x={cx}
              y={cy + halfSize * 0.35}
              textAnchor="middle"
              fontSize="10"
              fill="#374151"
            >
              {element.variable}
            </text>
            <text
              x={cx}
              y={cy + halfSize * 0.9}
              textAnchor="middle"
              fontSize="9"
              fill="#6b7280"
            >
              {element.value ?? 0}
            </text>
          </g>
        );

      default:
        return null;
    }
  };

  return (
    <g
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      className={isSelected ? 'selected' : ''}
    >
      {isSelected && (
        <rect
          x={cx - halfSize}
          y={cy - halfSize}
          width={halfSize * 2}
          height={halfSize * 2}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="4,2"
          rx={4}
        />
      )}
      {renderElement()}
    </g>
  );
};
