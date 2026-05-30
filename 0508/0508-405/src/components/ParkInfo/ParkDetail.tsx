import React from 'react';
import {
  MapPin,
  Clock,
  Maximize,
  Tag,
  Star,
  X,
  TreeDeciduous,
} from 'lucide-react';
import { Park, PARK_TYPE_LABELS, PARK_TYPE_COLORS } from '../../types';
import { formatArea } from '../../utils/distance';
import { districts } from '../../data/districts';

interface ParkDetailProps {
  park: Park | null;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
}

export const ParkDetail: React.FC<ParkDetailProps> = ({
  park,
  isFavorite,
  onToggleFavorite,
  onClose,
}) => {
  if (!park) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400">
        <TreeDeciduous className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-sm">点击地图上的公园查看详情</p>
      </div>
    );
  }

  const district = districts.find((d) => d.id === park.districtId);
  const typeColor = PARK_TYPE_COLORS[park.type];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-800 mb-2">{park.name}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="px-2 py-0.5 rounded-full text-xs text-white font-medium"
              style={{ backgroundColor: typeColor }}
            >
              {PARK_TYPE_LABELS[park.type]}
            </span>
            {district && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                {district.name}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleFavorite}
            className={`p-2 rounded-full transition-all duration-200 ${
              isFavorite
                ? 'bg-yellow-100 text-yellow-500'
                : 'bg-gray-100 text-gray-400 hover:bg-yellow-50 hover:text-yellow-500'
            }`}
          >
            <Star className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <Maximize className="w-4 h-4" />
              <span className="text-xs font-medium">面积</span>
            </div>
            <p className="text-lg font-bold text-gray-800">{formatArea(park.area)}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">开放时间</span>
            </div>
            <p className="text-sm font-bold text-gray-800">{park.openTime}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-3">
            <Tag className="w-4 h-4" />
            <span className="text-sm font-medium">公园设施</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {park.facilities.map((facility, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-white rounded-full text-sm text-gray-600 border border-gray-200"
              >
                {facility}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">位置</span>
          </div>
          <p className="text-sm text-gray-600">
            坐标：({park.x.toFixed(0)}, {park.y.toFixed(0)})
          </p>
        </div>
      </div>
    </div>
  );
};
