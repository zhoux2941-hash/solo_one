import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useSeismicStore } from '../store/useSeismicStore';
import { FilterParams } from '../types';

const FilterControls: React.FC = () => {
  const { filterParams, setFilterParams } = useSeismicStore();

  const filterTypes: Array<{ value: FilterParams['type']; label: string }> = [
    { value: 'none', label: '原始波形' },
    { value: 'lowpass', label: '低通滤波' },
    { value: 'highpass', label: '高通滤波' },
    { value: 'bandpass', label: '带通滤波' }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
        <SlidersHorizontal size={16} />
        波形滤波
      </h3>

      <div className="space-y-3">
        <div className="space-y-2">
          <label className="text-xs text-slate-400">滤波类型</label>
          <div className="grid grid-cols-2 gap-2">
            {filterTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setFilterParams({ type: type.value })}
                className={`px-3 py-2 rounded text-xs font-medium transition-all ${
                  filterParams.type === type.value
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {filterParams.type !== 'none' && (
          <div className="space-y-3 pt-2 border-t border-slate-700">
            {(filterParams.type === 'lowpass' || filterParams.type === 'bandpass') && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-slate-400">低通截止频率</label>
                  <span className="text-xs font-mono text-cyan-400">
                    {filterParams.lowFreq || 1} Hz
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={filterParams.lowFreq || 1}
                  onChange={(e) => setFilterParams({ lowFreq: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            )}

            {(filterParams.type === 'highpass' || filterParams.type === 'bandpass') && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-slate-400">高通截止频率</label>
                  <span className="text-xs font-mono text-cyan-400">
                    {filterParams.highFreq || 10} Hz
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="25"
                  step="0.5"
                  value={filterParams.highFreq || 10}
                  onChange={(e) => setFilterParams({ highFreq: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs text-slate-400">滤波器阶数</label>
                <span className="text-xs font-mono text-cyan-400">
                  {filterParams.order}
                </span>
              </div>
              <input
                type="range"
                min="11"
                max="101"
                step="10"
                value={filterParams.order}
                onChange={(e) => setFilterParams({ order: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterControls;
