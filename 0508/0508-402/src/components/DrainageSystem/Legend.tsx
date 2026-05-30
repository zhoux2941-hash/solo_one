import React from 'react';
import { STRUCTURE_LABELS, STRUCTURE_COLORS, StructureType } from '../../types';

const LEGEND_ITEMS: { type: StructureType; icon: string }[] = [
  { type: 'moat', icon: '■' },
  { type: 'canal', icon: '≋' },
  { type: 'reservoir', icon: '◼' },
  { type: 'outlet', icon: '◎' },
];

interface LegendProps {
  className?: string;
}

export const Legend: React.FC<LegendProps> = ({ className = '' }) => {
  return (
    <div className={`bg-cream-50 border border-ochre-200 rounded-lg p-4 ${className}`}>
      <h4 className="font-serif font-bold text-ochre-700 mb-3">图例说明</h4>
      <div className="grid grid-cols-2 gap-3">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.type} className="flex items-center gap-2">
            <span
              className="text-lg leading-none"
              style={{ color: STRUCTURE_COLORS[item.type] }}
            >
              {item.icon}
            </span>
            <span className="text-sm text-slategray-700">
              {STRUCTURE_LABELS[item.type]}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-ochre-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-slategray-400" style={{ borderStyle: 'dashed' }} />
          <span className="text-sm text-slategray-600">街道</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-4 h-3 border-2 border-ochre-700 bg-ochre-700/10 rounded-sm" />
          <span className="text-sm text-slategray-600">城墙</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-4 h-3 bg-ochre-800 border border-gold-500 rounded-sm" />
          <span className="text-sm text-slategray-600">城门</span>
        </div>
      </div>
    </div>
  );
};
