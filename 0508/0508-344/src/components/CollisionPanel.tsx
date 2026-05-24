import React from 'react';
import { AlertTriangle, AlertCircle, MapPin, Route, Layers, X } from 'lucide-react';
import { useChartStore } from '../store/useChartStore';
import type { CollisionType, Severity } from '../../shared/types';

const getCollisionTypeIcon = (type: CollisionType): React.ReactNode => {
  switch (type) {
    case 'main_route':
      return <Route size={14} />;
    case 'key_point':
      return <MapPin size={14} />;
    case 'other_element':
      return <Layers size={14} />;
  }
};

const collisionTypeLabels: Record<CollisionType, string> = {
  main_route: '主航线遮挡',
  key_point: '关键点遮挡',
  other_element: '元素重叠',
};

const getSeverityIcon = (severity: Severity): React.ReactNode => {
  switch (severity) {
    case 'danger':
      return <AlertCircle size={16} className="text-red-400" />;
    case 'warning':
      return <AlertTriangle size={16} className="text-yellow-400" />;
  }
};

const severityStyles: Record<Severity, { bg: string; border: string; text: string }> = {
  danger: {
    bg: 'bg-red-900/30',
    border: 'border-red-500',
    text: 'text-red-400',
  },
  warning: {
    bg: 'bg-yellow-900/30',
    border: 'border-yellow-500',
    text: 'text-yellow-400',
  },
};

export const CollisionPanel: React.FC = () => {
  const { collisions, setSelectedElement, selectedElementId } = useChartStore();

  const dangerCount = collisions.filter((c) => c.severity === 'danger').length;
  const warningCount = collisions.filter((c) => c.severity === 'warning').length;

  const handleFixPosition = (elementId: string) => {
    setSelectedElement(elementId);
  };

  return (
    <div className="w-72 bg-slate-900 border-l border-slate-700 flex flex-col h-full">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className={dangerCount > 0 ? 'text-red-400' : 'text-green-400'} />
            <h2 className="font-bold text-slate-100" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              碰撞检测
            </h2>
          </div>
          {collisions.length > 0 && (
            <div className="flex gap-2">
              {dangerCount > 0 && (
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/50">
                  {dangerCount} 严重
                </span>
              )}
              {warningCount > 0 && (
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/50">
                  {warningCount} 警告
                </span>
              )}
            </div>
          )}
        </div>

        {collisions.length === 0 && (
          <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg text-center">
            <div className="text-green-400 text-sm font-medium">✓ 无碰撞检测</div>
            <div className="text-green-400/60 text-xs mt-1">所有图层位置正常</div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {collisions.map((collision, index) => {
          const styles = severityStyles[collision.severity];
          const isSelected = selectedElementId === collision.elementId;

          return (
            <div
              key={`${collision.elementId}-${index}`}
              className={`p-3 rounded-lg border transition-all duration-200 ${styles.bg} ${styles.border} ${
                isSelected ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getSeverityIcon(collision.severity)}
                  <span className={`text-xs font-bold uppercase ${styles.text}`}>
                    {collision.severity === 'danger' ? '严重' : '警告'}
                  </span>
                </div>
                <button
                  className="p-1 rounded hover:bg-slate-700/50 transition-colors"
                  onClick={() => setSelectedElement(null)}
                >
                  <X size={12} className="text-slate-400" />
                </button>
              </div>

              <div className="text-sm text-slate-200 font-medium mb-1">
                {collision.elementText}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                {getCollisionTypeIcon(collision.collisionType)}
                <span>{collisionTypeLabels[collision.collisionType]}</span>
              </div>

              <p className="text-xs text-slate-300 mb-3">{collision.message}</p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  重叠面积: {Math.round(collision.overlapArea)} px²
                </span>
                <button
                  className="px-3 py-1.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                  onClick={() => handleFixPosition(collision.elementId)}
                >
                  定位调整
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-slate-700">
        <div className="text-xs text-slate-400 text-center">
          拖拽图层元素调整位置
        </div>
      </div>
    </div>
  );
};
