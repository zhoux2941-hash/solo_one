import React from 'react';
import { ParkType, PARK_TYPE_LABELS, PARK_TYPE_COLORS } from '../../types';

interface ParkTypeFilterProps {
  selectedTypes: ParkType[];
  onTypeToggle: (type: ParkType) => void;
}

export const ParkTypeFilter: React.FC<ParkTypeFilterProps> = ({
  selectedTypes,
  onTypeToggle,
}) => {
  const allTypes: ParkType[] = ['comprehensive', 'community', 'specialized', 'garden'];

  return (
    <div className="flex flex-wrap gap-2">
      {allTypes.map((type) => {
        const isSelected = selectedTypes.includes(type);
        const color = PARK_TYPE_COLORS[type];

        return (
          <button
            key={type}
            onClick={() => onTypeToggle(type)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isSelected
                ? 'text-white shadow-md transform scale-105'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={{
              backgroundColor: isSelected ? color : undefined,
            }}
          >
            {PARK_TYPE_LABELS[type]}
          </button>
        );
      })}
    </div>
  );
};
