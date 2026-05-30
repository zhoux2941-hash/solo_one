import React from 'react';
import { CITIES } from '../../data/cities';
import { CityCard } from './CityCard';
import { useAppStore } from '../../store/useAppStore';
import { GitCompare, X } from 'lucide-react';
import { cn } from '../../utils';

export const CityList: React.FC = () => {
  const { compareMode, toggleCompareMode, clearCompareCities, compareCityIds } = useAppStore();

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-serif text-2xl font-bold text-ochre-700">城池概览</h2>
          <p className="text-sm text-slategray-500 mt-1">点击城池查看排水系统详情</p>
        </div>
        <div className="flex items-center gap-3">
          {compareMode && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-navy-50 text-navy-600 rounded-lg text-sm">
              <span>已选择 {compareCityIds.length}/2</span>
              {compareCityIds.length > 0 && (
                <button
                  onClick={clearCompareCities}
                  className="p-1 hover:bg-navy-100 rounded transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
          <button
            onClick={toggleCompareMode}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300',
              compareMode
                ? 'bg-navy-500 text-white shadow-lg shadow-navy-500/30'
                : 'bg-ochre-100 text-ochre-700 hover:bg-ochre-200'
            )}
          >
            <GitCompare size={18} />
            <span>{compareMode ? '退出对比' : '对比模式'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {CITIES.map((city, index) => (
          <CityCard key={city.id} city={city} index={index} />
        ))}
      </div>
    </div>
  );
};
