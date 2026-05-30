import React from 'react';
import { Star, MapPin, X, Navigation } from 'lucide-react';
import { Park, PARK_TYPE_LABELS, PARK_TYPE_COLORS } from '../../types';

interface FavoriteListProps {
  parks: Park[];
  onParkClick: (park: Park) => void;
  onRemove: (parkId: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export const FavoriteList: React.FC<FavoriteListProps> = ({
  parks,
  onParkClick,
  onRemove,
  isExpanded,
  onToggle,
}) => {
  if (parks.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-yellow-50 to-amber-50 hover:from-yellow-100 hover:to-amber-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
          <span className="font-semibold text-gray-800">我的收藏</span>
          <span className="px-2 py-0.5 bg-yellow-200 text-yellow-700 rounded-full text-xs font-medium">
            {parks.length}
          </span>
        </div>
        <Navigation
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isExpanded && (
        <div className="max-h-60 overflow-y-auto">
          {parks.map((park) => {
            const typeColor = PARK_TYPE_COLORS[park.type];
            return (
              <div
                key={park.id}
                className="px-4 py-3 border-b border-gray-50 last:border-0 group hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => onParkClick(park)}
                  >
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-800 group-hover:text-green-600 transition-colors">
                        {park.name}
                      </h4>
                      <span
                        className="px-1.5 py-0.5 rounded text-xs text-white"
                        style={{ backgroundColor: typeColor }}
                      >
                        {PARK_TYPE_LABELS[park.type]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      <span>点击查看位置</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(park.id);
                    }}
                    className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-all"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
