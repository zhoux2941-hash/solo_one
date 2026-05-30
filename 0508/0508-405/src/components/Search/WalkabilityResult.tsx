import React from 'react';
import { MapPin, Clock, Footprints, Navigation } from 'lucide-react';
import { WalkabilityResult as WalkabilityResultType } from '../../types';
import { formatDistance } from '../../utils/distance';

interface WalkabilityResultProps {
  results: WalkabilityResultType[];
  onParkClick: (parkId: string) => void;
}

export const WalkabilityResult: React.FC<WalkabilityResultProps> = ({
  results,
  onParkClick,
}) => {
  if (results.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
      <div className="flex items-center gap-2 mb-3">
        <Footprints className="w-5 h-5 text-orange-600" />
        <h3 className="font-semibold text-gray-800">最近的公园</h3>
        <span className="text-xs text-gray-500">步行速度：5km/h</span>
      </div>

      <div className="space-y-3">
        {results.map((result, index) => (
          <div
            key={result.park.id}
            onClick={() => onParkClick(result.park.id)}
            className="bg-white rounded-lg p-3 cursor-pointer hover:shadow-md transition-all duration-200 border border-orange-100"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      index === 0 ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <h4 className="font-medium text-gray-800">{result.park.name}</h4>
                </div>
                <div className="mt-2 ml-8 flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{formatDistance(result.distance)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>步行约 {result.walkTime} 分钟</span>
                  </div>
                </div>
              </div>
              <Navigation className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
