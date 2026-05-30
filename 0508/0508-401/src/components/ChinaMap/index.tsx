import React, { useState, useMemo } from 'react';
import { NianhuaLocation, ThemeType } from '../../types';
import { getNianhuaLocations } from '../../config';

interface ChinaMapProps {
  selectedLocation: NianhuaLocation | null;
  onLocationSelect: (location: NianhuaLocation) => void;
  selectedTheme: ThemeType;
}

const ChinaMap: React.FC<ChinaMapProps> = ({
  selectedLocation,
  onLocationSelect,
  selectedTheme
}) => {
  const nianhuaLocations = useMemo(() => getNianhuaLocations(), []);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);

  const isLocationHighlighted = (location: NianhuaLocation): boolean => {
    if (selectedTheme === 'all') return true;
    return location.representativeWorks.some(work => work.theme === selectedTheme);
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg overflow-hidden">
      <svg
        viewBox="0 0 800 600"
        className="w-full h-full"
        style={{ maxHeight: '70vh' }}
      >
        <defs>
          <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5E6D3" />
            <stop offset="100%" stopColor="#E8D4B8" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <path
          d="M200,100 L250,80 L300,70 L380,60 L450,55 L520,70 L580,90 L640,120 
             L680,160 L700,210 L710,270 L700,330 L680,380 L640,430 L590,470 
             L530,500 L470,520 L400,530 L330,520 L270,500 L210,470 L160,430 
             L120,380 L90,320 L80,260 L90,200 L120,150 L160,110 Z"
          fill="url(#mapGradient)"
          stroke="#C4A06B"
          strokeWidth="2"
          className="drop-shadow-lg"
        />

        <path
          d="M300,150 Q350,140 400,160 T500,150"
          stroke="#D4B896"
          strokeWidth="1"
          fill="none"
          opacity="0.5"
        />
        <path
          d="M250,250 Q350,240 450,260 T600,250"
          stroke="#D4B896"
          strokeWidth="1"
          fill="none"
          opacity="0.5"
        />
        <path
          d="M350,350 Q450,340 550,360"
          stroke="#D4B896"
          strokeWidth="1"
          fill="none"
          opacity="0.5"
        />

        {nianhuaLocations.map((location) => {
          const isHighlighted = isLocationHighlighted(location);
          const isSelected = selectedLocation?.id === location.id;
          const isHovered = hoveredLocation === location.id;
          const x = location.position.x * 8;
          const y = location.position.y * 6;

          return (
            <g key={location.id}>
              {isHighlighted && (isSelected || isHovered) && (
                <circle
                  cx={x}
                  cy={y}
                  r="25"
                  fill="none"
                  stroke="#C41E3A"
                  strokeWidth="2"
                  opacity="0.6"
                  className="animate-pulse"
                  filter="url(#glow)"
                />
              )}

              <circle
                cx={x}
                cy={y}
                r={isSelected ? 14 : isHovered ? 12 : 10}
                fill={isHighlighted ? '#C41E3A' : '#9CA3AF'}
                stroke={isSelected ? '#D4AF37' : isHighlighted ? '#FFF' : '#6B7280'}
                strokeWidth="3"
                className={`cursor-pointer transition-all duration-300 ${
                  isHighlighted ? 'hover:opacity-90' : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={() => isHighlighted && onLocationSelect(location)}
                onMouseEnter={() => setHoveredLocation(location.id)}
                onMouseLeave={() => setHoveredLocation(null)}
                filter={isHighlighted ? 'url(#glow)' : undefined}
              />

              {isHighlighted && (
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#FFF"
                  className="pointer-events-none"
                />
              )}

              {(isHovered || isSelected) && isHighlighted && (
                <>
                  <rect
                    x={x - 50}
                    y={y - 45}
                    width="100"
                    height="28"
                    rx="4"
                    fill="#2C2C2C"
                    className="pointer-events-none"
                  />
                  <text
                    x={x}
                    y={y - 27}
                    textAnchor="middle"
                    fill="#FFF"
                    fontSize="12"
                    fontWeight="600"
                    className="pointer-events-none"
                  >
                    {location.name}
                  </text>
                </>
              )}

              {isHighlighted && !isHovered && !isSelected && (
                <text
                  x={x + 18}
                  y={y + 4}
                  fill="#5C4033"
                  fontSize="11"
                  fontWeight="500"
                  className="pointer-events-none"
                >
                  {location.name.replace(/[（(].+[）)]/, '')}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="text-sm font-medium text-gray-700 mb-2">图例说明</div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="w-3 h-3 rounded-full bg-red-700"></span>
          <span>年画产地</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
          <span className="w-3 h-3 rounded-full bg-gray-400 opacity-50"></span>
          <span>当前筛选无相关主题</span>
        </div>
      </div>
    </div>
  );
};

export default ChinaMap;
