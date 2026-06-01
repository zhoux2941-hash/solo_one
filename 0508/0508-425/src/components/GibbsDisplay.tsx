import React from 'react';
import { TrendingUp, Target } from 'lucide-react';
import type { GibbsData } from '../types';

interface GibbsDisplayProps {
  gibbsData: GibbsData;
  harmonicCount: number;
}

export const GibbsDisplay: React.FC<GibbsDisplayProps> = ({
  gibbsData,
  harmonicCount,
}) => {
  const progressPercent = Math.min(
    (gibbsData.overshootPercent / gibbsData.theoreticalValue) * 100,
    100
  );

  return (
    <div className="bg-[#12121f] rounded-xl p-6 border border-yellow-500/20 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-yellow-500/20 rounded-lg">
          <TrendingUp className="w-6 h-6 text-yellow-400" />
        </div>
        <h2 className="text-xl font-bold text-white">吉布斯现象</h2>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">当前过冲</p>
            <p className="text-2xl font-bold text-yellow-400">
              {gibbsData.overshootPercent.toFixed(2)}%
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-1 mb-1">
              <Target className="w-3 h-3 text-gray-400" />
              <p className="text-xs text-gray-400">理论极限</p>
            </div>
            <p className="text-2xl font-bold text-gray-300">
              {gibbsData.theoreticalValue}%
            </p>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>趋近进度</span>
            <span>{progressPercent.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
          <p className="text-sm text-gray-300 leading-relaxed">
            随着谐波次数增加到 <span className="text-yellow-400 font-bold">{harmonicCount}</span> 次，
            波形在不连续点处的过冲逐渐趋近于理论极限 
            <span className="text-yellow-400 font-bold"> 8.94%</span>。
          </p>
          <p className="text-xs text-gray-500 mt-2">
            峰值: {gibbsData.peakValue.toFixed(4)} / 理想值: {gibbsData.idealValue}
          </p>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>💡 吉布斯现象说明：</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>傅里叶级数在断点处会产生过冲</li>
            <li>增加谐波次数只能缩窄过冲宽度</li>
            <li>过冲幅度始终约为 9%，无法消除</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
