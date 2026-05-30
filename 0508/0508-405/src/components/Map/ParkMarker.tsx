import React, { useState } from 'react';
import { Park, PARK_TYPE_COLORS } from '../../types';

interface ParkMarkerProps {
  park: Park;
  isSelected: boolean;
  onClick: () => void;
  scale?: number;
}

export const ParkMarker: React.FC<ParkMarkerProps> = ({
  park,
  isSelected,
  onClick,
  scale = 0.0008,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const radius = Math.sqrt(park.area * scale);
  const color = PARK_TYPE_COLORS[park.type];

  return (
    <g
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="cursor-pointer"
    >
      <circle
        cx={park.x}
        cy={park.y}
        r={radius + 4}
        fill={color}
        fillOpacity={isSelected || isHovered ? 0.3 : 0.1}
        className="transition-all duration-300"
      />
      <circle
        cx={park.x}
        cy={park.y}
        r={radius}
        fill={color}
        stroke={isSelected ? '#fff' : 'transparent'}
        strokeWidth={isSelected ? 3 : 0}
        className="transition-all duration-300 hover:brightness-110"
        style={{
          filter: isSelected
            ? 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))'
            : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
        }}
      />
      {(isHovered || isSelected) && (
        <>
          <rect
            x={park.x - 60}
            y={park.y - radius - 45}
            width={120}
            height={28}
            rx={6}
            fill="#1F2937"
            fillOpacity={0.9}
          />
          <text
            x={park.x}
            y={park.y - radius - 27}
            textAnchor="middle"
            fill="white"
            fontSize={12}
            fontWeight={500}
            className="select-none pointer-events-none"
          >
            {park.name}
          </text>
        </>
      )}
    </g>
  );
};
