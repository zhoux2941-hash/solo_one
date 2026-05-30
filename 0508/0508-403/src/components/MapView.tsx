import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useAppStore } from '@/store/useAppStore';
import { lines, stations, stationMap, lineStationsByLine } from '@/data/railwayConfig';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

export default function MapView() {
  const { selectedStationId, highlightedLineId, selectStation } = useAppStore();

  return (
    <TransformWrapper
      initialScale={0.8}
      minScale={0.3}
      maxScale={4}
      centerOnInit
    >
      {({ zoomIn, zoomOut, resetTransform }) => (
        <div className="relative w-full h-full bg-gray-950">
          <TransformComponent
            wrapperClass="!w-full !h-full"
            contentClass="!w-full !h-full"
          >
            <svg
              viewBox="0 0 1000 1200"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="pulse-glow">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="blur" />
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(51,65,85,0.15)" strokeWidth="0.5" />
                </pattern>
                <radialGradient id="bg-grad" cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#020617" />
                </radialGradient>
              </defs>

              <rect width="1000" height="1200" fill="url(#bg-grad)" />
              <rect width="1000" height="1200" fill="url(#grid)" />

              {lines.map((line) => {
                const lsList = lineStationsByLine[line.id];
                if (!lsList || lsList.length === 0) return null;

                const points = lsList
                  .map((ls) => {
                    const s = stationMap[ls.stationId];
                    return s ? `${s.x},${s.y}` : null;
                  })
                  .filter(Boolean)
                  .join(' ');

                const isHighlighted =
                  highlightedLineId === null ||
                  highlightedLineId === line.id;

                return (
                  <g key={line.id}>
                    <polyline
                      points={points}
                      fill="none"
                      stroke={line.color}
                      strokeWidth={6}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      opacity={isHighlighted ? 0.2 : 0.05}
                    />
                    <polyline
                      points={points}
                      fill="none"
                      stroke={line.color}
                      strokeWidth={3}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      opacity={isHighlighted ? 1 : 0.2}
                      style={{ transition: 'opacity 0.3s ease' }}
                    />
                  </g>
                );
              })}

              {stations.map((station) => {
                const isMajor = station.lines.length >= 2;
                const isSelected = selectedStationId === station.id;
                const radius = isMajor ? 6 : 4;

                return (
                  <g key={station.id}>
                    {isSelected && (
                      <>
                        <circle
                          cx={station.x}
                          cy={station.y}
                          r={14}
                          fill="none"
                          stroke="#facc15"
                          strokeWidth={2}
                          opacity={0.6}
                          filter="url(#pulse-glow)"
                        >
                          <animate
                            attributeName="r"
                            values="10;18;10"
                            dur="1.5s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="opacity"
                            values="0.6;0.2;0.6"
                            dur="1.5s"
                            repeatCount="indefinite"
                          />
                        </circle>
                        <circle
                          cx={station.x}
                          cy={station.y}
                          r={radius + 2}
                          fill="#facc15"
                          stroke="#facc15"
                          strokeWidth={2}
                          filter="url(#glow)"
                        />
                      </>
                    )}

                    <circle
                      cx={station.x}
                      cy={station.y}
                      r={radius}
                      fill={isSelected ? '#facc15' : '#ffffff'}
                      stroke={isMajor ? '#1e293b' : '#334155'}
                      strokeWidth={isMajor ? 2 : 1.5}
                      className="cursor-pointer"
                      onClick={() => selectStation(station.id)}
                      style={{ transition: 'fill 0.2s ease' }}
                    />

                    {isMajor && (
                      <text
                        x={station.x}
                        y={station.y - radius - 6}
                        textAnchor="middle"
                        fontSize={9}
                        fontWeight={600}
                        fill="#e2e8f0"
                        stroke="#0f172a"
                        strokeWidth={2.5}
                        paintOrder="stroke"
                        className="pointer-events-none select-none"
                      >
                        {station.name}
                      </text>
                    )}
                  </g>
                );
              })}

              <text x="500" y="50" textAnchor="middle" fontSize="20" fontWeight="700" fill="#94a3b8" letterSpacing="8">
                全 国 高 铁 线 路 图
              </text>
              <text x="500" y="72" textAnchor="middle" fontSize="9" fill="#475569" letterSpacing="2">
                CHINA HIGH-SPEED RAIL NETWORK
              </text>
            </svg>
          </TransformComponent>

          <div className="absolute bottom-4 left-4 flex flex-col gap-2 bg-gray-900/80 backdrop-blur-sm rounded-lg p-1.5">
            <button
              onClick={() => zoomIn()}
              className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700/60 transition-colors"
              title="放大"
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={() => zoomOut()}
              className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700/60 transition-colors"
              title="缩小"
            >
              <ZoomOut size={18} />
            </button>
            <button
              onClick={() => resetTransform()}
              className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700/60 transition-colors"
              title="重置"
            >
              <Maximize size={18} />
            </button>
          </div>
        </div>
      )}
    </TransformWrapper>
  );
}
