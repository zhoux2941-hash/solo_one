import React from 'react';
import { Layers, Eye, EyeOff, Anchor, FileText, AlertTriangle, Ship } from 'lucide-react';
import { useChartStore } from '../store/useChartStore';
import { layerTypeConfig } from '../data/mockData';
import type { LayerType } from '../../shared/types';

const layerIcons: Record<LayerType, React.ReactNode> = {
  channel_note: <FileText size={16} />,
  warning_zone: <AlertTriangle size={16} />,
  anchorage: <Anchor size={16} />,
  berth_point: <Ship size={16} />,
};

export const LayerPanel: React.FC = () => {
  const { layerVisibility, toggleLayerVisibility, elements } = useChartStore();

  const layerTypes: LayerType[] = ['channel_note', 'warning_zone', 'anchorage', 'berth_point'];

  const getElementCount = (type: LayerType) => {
    return elements.filter((e) => e.type === type).length;
  };

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col h-full">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Layers size={20} className="text-blue-400" />
          <h2 className="font-bold text-slate-100" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            图层管理
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {layerTypes.map((type) => {
          const config = layerTypeConfig[type];
          const isVisible = layerVisibility[type];
          const count = getElementCount(type);

          return (
            <div
              key={type}
              className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                isVisible
                  ? 'bg-slate-800 border-slate-600 hover:border-slate-500'
                  : 'bg-slate-850 border-slate-700 opacity-60'
              }`}
              onClick={() => toggleLayerVisibility(type)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center"
                    style={{ backgroundColor: config.bgColor, color: config.color }}
                  >
                    {layerIcons[type]}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-200">{config.label}</div>
                    <div className="text-xs text-slate-400">{count} 个元素</div>
                  </div>
                </div>
                <button
                  className="p-1.5 rounded hover:bg-slate-700 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayerVisibility(type);
                  }}
                >
                  {isVisible ? (
                    <Eye size={16} className="text-slate-300" />
                  ) : (
                    <EyeOff size={16} className="text-slate-500" />
                  )}
                </button>
              </div>

              <div className="mt-2 h-1 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: isVisible ? '100%' : '0%',
                    backgroundColor: config.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-slate-700">
        <div className="text-xs text-slate-400 text-center">
          点击图层切换显示/隐藏
        </div>
      </div>
    </div>
  );
};
