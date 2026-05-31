import React from 'react';
import { Building2, AlertTriangle, TrendingDown, Info } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getLowestAccuracyBuildings, getInsufficientSampleBuildings, MIN_SAMPLE_THRESHOLD } from '../utils/statistics';

export const BuildingRank: React.FC = () => {
  const { buildingStats, filteredRecords } = useAppStore();

  const lowestBuildings = getLowestAccuracyBuildings(buildingStats, 5);
  const insufficientSampleBuildings = getInsufficientSampleBuildings(buildingStats);

  if (filteredRecords.length === 0) {
    return null;
  }

  const getAccuracyColor = (accuracy: number): string => {
    if (accuracy >= 80) return 'text-green-600 bg-green-50';
    if (accuracy >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getProgressColor = (accuracy: number): string => {
    if (accuracy >= 80) return 'bg-green-500';
    if (accuracy >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRankBadge = (index: number): string => {
    if (index === 0) return 'bg-red-500 text-white';
    if (index === 1) return 'bg-orange-500 text-white';
    if (index === 2) return 'bg-yellow-500 text-white';
    return 'bg-gray-200 text-gray-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-red-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">正确率最低TOP5</h3>
          <p className="text-xs text-gray-500">需重点关注的楼栋</p>
        </div>
      </div>

      {lowestBuildings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Building2 className="w-12 h-12 mb-2 opacity-50" />
          <p className="text-sm">暂无足够数据</p>
        </div>
      ) : (
        <div className="space-y-4">
          {lowestBuildings.map((building, index) => (
            <div
              key={building.buildingNumber}
              className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getRankBadge(index)}`}
                  >
                    {index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-800">
                      {building.buildingNumber}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-red-500" />
                  <span
                    className={`px-2 py-0.5 rounded-full text-sm font-bold ${getAccuracyColor(building.accuracy)}`}
                  >
                    {building.accuracy.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${getProgressColor(building.accuracy)}`}
                  style={{ width: `${building.accuracy}%` }}
                />
              </div>
              
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>投放总数: {building.total}</span>
                <span>正确: {building.correct}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {insufficientSampleBuildings.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center">
              <Info className="w-3.5 h-3.5 text-gray-500" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700">样本不足</h4>
              <p className="text-xs text-gray-400">
                投放记录 &lt; {MIN_SAMPLE_THRESHOLD} 条，不参与排名
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {insufficientSampleBuildings.map((building) => (
              <div
                key={building.buildingNumber}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg opacity-70"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-sm text-gray-600">{building.buildingNumber}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                    {building.total} 条记录
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
