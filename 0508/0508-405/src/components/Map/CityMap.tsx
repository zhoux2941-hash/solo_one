import React from 'react';
import { District } from './District';
import { ParkMarker } from './ParkMarker';
import { District as DistrictType, Park, WalkabilityResult } from '../../types';

interface CityMapProps {
  districts: DistrictType[];
  parks: Park[];
  selectedPark: Park | null;
  onParkClick: (park: Park) => void;
  searchLocation?: { x: number; y: number } | null;
  walkabilityResults?: WalkabilityResult[];
}

export const CityMap: React.FC<CityMapProps> = ({
  districts,
  parks,
  selectedPark,
  onParkClick,
  searchLocation,
  walkabilityResults = [],
}) => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl overflow-hidden shadow-inner">
      <svg
        viewBox="150 0 800 650"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect x="150" y="0" width="800" height="650" fill="url(#grid)" />

        {districts.map((district) => (
          <District key={district.id} district={district} />
        ))}

        {districts.map((district) => {
          const path = district.boundary;
          const coords = path.match(/[-+]?[0-9]*\.?[0-9]+/g)?.map(Number);
          if (!coords || coords.length < 4) return null;

          let sumX = 0,
            sumY = 0,
            count = 0;
          for (let i = 0; i < coords.length; i += 2) {
            sumX += coords[i];
            sumY += coords[i + 1];
            count++;
          }
          const centerX = sumX / count;
          const centerY = sumY / count;

          return (
            <text
              key={`label-${district.id}`}
              x={centerX}
              y={centerY}
              textAnchor="middle"
              fill="#64748B"
              fontSize={14}
              fontWeight={600}
              className="select-none pointer-events-none"
            >
              {district.name}
            </text>
          );
        })}

        {searchLocation && (
          <g>
            {walkabilityResults.map((result, index) => (
              <line
                key={`line-${result.park.id}`}
                x1={searchLocation.x}
                y1={searchLocation.y}
                x2={result.park.x}
                y2={result.park.y}
                stroke={index === 0 ? '#22C55E' : '#3B82F6'}
                strokeWidth="2"
                strokeDasharray="8,4"
                className="transition-all duration-300"
              />
            ))}
            <circle
              cx={searchLocation.x}
              cy={searchLocation.y}
              r={20}
              fill="#E67E22"
              fillOpacity={0.2}
              className="animate-ping"
            />
            <circle
              cx={searchLocation.x}
              cy={searchLocation.y}
              r={8}
              fill="#E67E22"
              stroke="#fff"
              strokeWidth={2}
            />
            <text
              x={searchLocation.x}
              y={searchLocation.y - 25}
              textAnchor="middle"
              fill="#E67E22"
              fontSize={12}
              fontWeight={600}
            >
              我的位置
            </text>
          </g>
        )}

        {parks.map((park) => (
          <ParkMarker
            key={park.id}
            park={park}
            isSelected={selectedPark?.id === park.id}
            onClick={() => onParkClick(park)}
          />
        ))}
      </svg>
    </div>
  );
};
