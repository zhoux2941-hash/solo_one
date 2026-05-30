import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, X, Info } from 'lucide-react';
import { City, DrainageStructure, STRUCTURE_LABELS } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { pointsToPath, cn } from '../../utils';
import { getStructuresByCityId } from '../../data/drainageData';
import { Legend } from './Legend';

interface DrainageMapProps {
  city: City;
  className?: string;
  showTitle?: boolean;
}

export const DrainageMap: React.FC<DrainageMapProps> = ({ city, className = '', showTitle = true }) => {
  const { activeHotspotId, setActiveHotspot } = useAppStore();
  const [zoom, setZoom] = useState(1);
  const [selectedStructure, setSelectedStructure] = useState<DrainageStructure | null>(null);

  const structures = getStructuresByCityId(city.id);
  const outlinePath = pointsToPath(city.outline);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.2, 2));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.5));
  const handleReset = () => setZoom(1);

  const handleStructureClick = (structure: DrainageStructure, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedStructure(structure);
    setActiveHotspot(structure.id);
  };

  const handleCloseDetail = () => {
    setSelectedStructure(null);
    setActiveHotspot(null);
  };

  const renderStructure = (structure: DrainageStructure) => {
    const isActive = activeHotspotId === structure.id || selectedStructure?.id === structure.id;

    switch (structure.type) {
      case 'moat':
        return (
          <rect
            key={structure.id}
            x={structure.x}
            y={structure.y}
            width={structure.width}
            height={structure.height}
            rx="8"
            className="drainage-moat cursor-pointer transition-all duration-300"
            style={{
              filter: isActive ? 'drop-shadow(0 0 12px rgba(30, 58, 74, 0.8))' : 'none',
            }}
            onClick={(e) => handleStructureClick(structure, e)}
          />
        );

      case 'canal':
        return (
          <g key={structure.id} className="cursor-pointer">
            <path
              d={structure.path || `M${structure.x},${structure.y + structure.height / 2} L${structure.x + structure.width},${structure.y + structure.height / 2}`}
              className="drainage-canal transition-all duration-300"
              style={{
                strokeWidth: isActive ? 5 : 3,
                filter: isActive ? 'drop-shadow(0 0 8px rgba(74, 144, 164, 0.8))' : 'none',
              }}
              onClick={(e) => handleStructureClick(structure, e)}
            />
            {isActive && (
              <path
                d={structure.path || `M${structure.x},${structure.y + structure.height / 2} L${structure.x + structure.width},${structure.y + structure.height / 2}`}
                fill="none"
                stroke="#4A90A4"
                strokeWidth="12"
                opacity="0.3"
              />
            )}
          </g>
        );

      case 'reservoir':
        return (
          <g key={structure.id} className="cursor-pointer">
            <rect
              x={structure.x}
              y={structure.y}
              width={structure.width}
              height={structure.height}
              rx="4"
              className="drainage-reservoir transition-all duration-300"
              style={{
                filter: isActive ? 'drop-shadow(0 0 10px rgba(46, 90, 107, 0.8))' : 'none',
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                transformOrigin: 'center',
              }}
              onClick={(e) => handleStructureClick(structure, e)}
            />
            {isActive && (
              <circle
                cx={structure.x + structure.width / 2}
                cy={structure.y + structure.height / 2}
                r={Math.max(structure.width, structure.height) / 2 + 10}
                fill="none"
                stroke="#2E5A6B"
                strokeWidth="2"
                className="hotspot-pulse"
                opacity="0.5"
              />
            )}
          </g>
        );

      case 'outlet':
        return (
          <g key={structure.id} className="cursor-pointer">
            {isActive && (
              <circle
                cx={structure.x + structure.width / 2}
                cy={structure.y + structure.height / 2}
                r="25"
                fill="none"
                stroke="#DAA520"
                strokeWidth="2"
                className="hotspot-pulse"
              />
            )}
            <circle
              cx={structure.x + structure.width / 2}
              cy={structure.y + structure.height / 2}
              r={isActive ? 14 : 10}
              className="drainage-outlet transition-all duration-300"
              style={{
                filter: isActive ? 'drop-shadow(0 0 8px rgba(218, 165, 32, 0.8))' : 'none',
              }}
              onClick={(e) => handleStructureClick(structure, e)}
            />
            <circle
              cx={structure.x + structure.width / 2}
              cy={structure.y + structure.height / 2}
              r="4"
              fill="#DAA520"
              onClick={(e) => handleStructureClick(structure, e)}
            />
          </g>
        );

      default:
        return null;
    }
  };

  const renderHotspotLabel = (structure: DrainageStructure) => {
    if (structure.type === 'canal') return null;

    const labelX = structure.x + structure.width / 2;
    const labelY = structure.type === 'outlet'
      ? structure.y + structure.height + 20
      : structure.y - 10;

    return (
      <g key={`label-${structure.id}`} className="pointer-events-none">
        <rect
          x={labelX - 30}
          y={labelY - 12}
          width="60"
          height="24"
          rx="4"
          fill="rgba(250, 245, 240, 0.95)"
          stroke="#8B4513"
          strokeWidth="1"
        />
        <text
          x={labelX}
          y={labelY + 4}
          textAnchor="middle"
          className="fill-ochre-700"
          style={{ fontSize: '11px', fontFamily: 'Noto Sans SC', fontWeight: 500 }}
        >
          {structure.name}
        </text>
      </g>
    );
  };

  return (
    <div className={cn('relative bg-cream-50 rounded-xl overflow-hidden', className)}>
      {showTitle && (
        <div className="px-6 py-4 border-b border-ochre-200 bg-gradient-to-r from-ochre-50 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl font-bold text-ochre-700">{city.name}</h3>
              <p className="text-sm text-slategray-500">{city.dynasty} · 排水系统结构图</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                className="p-2 rounded-lg bg-ochre-100 text-ochre-600 hover:bg-ochre-200 transition-colors"
                title="缩小"
              >
                <ZoomOut size={18} />
              </button>
              <span className="text-sm text-slategray-600 w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-2 rounded-lg bg-ochre-100 text-ochre-600 hover:bg-ochre-200 transition-colors"
                title="放大"
              >
                <ZoomIn size={18} />
              </button>
              <button
                onClick={handleReset}
                className="p-2 rounded-lg bg-ochre-100 text-ochre-600 hover:bg-ochre-200 transition-colors"
                title="重置"
              >
                <Maximize2 size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative flex">
        <div className="flex-1 overflow-auto p-6" style={{ height: '500px' }}>
          <svg
            viewBox="0 0 600 520"
            className="w-full h-full transition-transform duration-300"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              minWidth: '600px',
              minHeight: '520px',
            }}
          >
            <defs>
              <pattern id={`grid-drainage-${city.id}`} width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#E8D5C4" strokeWidth="0.5" />
              </pattern>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <rect width="600" height="520" fill={`url(#grid-drainage-${city.id})`} />

            <g className="street-grid">
              {[130, 230, 330, 430].map((x, i) => (
                <line key={`v-${i}`} x1={x} y1="100" x2={x} y2="420" />
              ))}
              {[150, 230, 310, 390].map((y, i) => (
                <line key={`h-${i}`} x1="120" y1={y} x2="480" y2={y} />
              ))}
            </g>

            {structures.filter(s => s.type === 'moat').map(renderStructure)}

            <path d={outlinePath} className="city-wall" />

            {city.gates.map((gate) => (
              <g key={gate.name}>
                <rect
                  x={gate.x - 12}
                  y={gate.y - 8}
                  width="24"
                  height="16"
                  rx="2"
                  className="city-gate"
                />
              </g>
            ))}

            {structures.filter(s => s.type === 'canal').map(renderStructure)}
            {structures.filter(s => s.type === 'reservoir').map(renderStructure)}
            {structures.filter(s => s.type === 'outlet').map(renderStructure)}

            {structures.filter(s => s.type !== 'canal').map(renderHotspotLabel)}

            {structures.filter(s => s.type === 'canal').map(structure => (
              <text
                key={`canal-label-${structure.id}`}
                x={structure.x + structure.width / 2}
                y={structure.y + 5}
                textAnchor="middle"
                className="fill-slategray-600 pointer-events-none"
                style={{ fontSize: '10px', fontFamily: 'Noto Sans SC' }}
              >
                {structure.name}
              </text>
            ))}
          </svg>
        </div>

        <div className="w-56 p-4 border-l border-ochre-200 bg-cream-100/50">
          <Legend />

          <div className="mt-4 p-4 bg-ochre-50 border border-ochre-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2 text-ochre-700">
              <Info size={16} />
              <span className="font-medium text-sm">交互提示</span>
            </div>
            <p className="text-xs text-slategray-600 leading-relaxed">
              点击图中的排水设施查看详细信息。使用缩放按钮可以更清晰地查看细节。
            </p>
          </div>
        </div>
      </div>

      {selectedStructure && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20" onClick={handleCloseDetail}>
          <div
            className="bg-cream-50 rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-scroll-reveal"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-ochre-500 to-ochre-600 text-white">
              <div>
                <h4 className="font-serif text-lg font-bold">{selectedStructure.name}</h4>
                <span className="text-ochre-100 text-sm">
                  {STRUCTURE_LABELS[selectedStructure.type]}
                </span>
              </div>
              <button
                onClick={handleCloseDetail}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slategray-700 leading-relaxed mb-4">
                {selectedStructure.description}
              </p>
              {selectedStructure.historicalNote && (
                <div className="p-4 bg-gold-50 border-l-4 border-gold-500 rounded-r-lg">
                  <p className="text-sm text-ochre-700 italic">
                    📜 {selectedStructure.historicalNote}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
