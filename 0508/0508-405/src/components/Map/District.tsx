import React from 'react';
import { District as DistrictType } from '../../types';

interface DistrictProps {
  district: DistrictType;
}

export const District: React.FC<DistrictProps> = ({ district }) => {
  return (
    <path
      d={district.boundary}
      fill={district.color}
      stroke="#94A3B8"
      strokeWidth="2"
      className="transition-all duration-300 hover:brightness-95"
    />
  );
};
