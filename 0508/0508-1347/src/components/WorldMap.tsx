import { useMemo } from 'react';
import { inventions, allNodes, spreadRoutes } from '@/data/inventions';
import { useMapStore } from '@/store/useMapStore';

const continentPaths = [
  {
    name: 'North America',
    d: 'M180,80 L210,65 L240,60 L270,65 L290,55 L320,60 L340,75 L335,85 L350,90 L345,100 L355,105 L350,115 L340,120 L345,135 L330,140 L320,150 L310,155 L295,160 L280,155 L270,160 L260,158 L250,165 L235,160 L225,155 L215,165 L200,170 L195,165 L185,168 L175,160 L170,145 L165,130 L160,120 L155,105 L160,95 L170,88 Z',
  },
  {
    name: 'Greenland',
    d: 'M365,35 L385,30 L400,35 L405,50 L395,60 L380,58 L365,55 L360,45 Z',
  },
  {
    name: 'South America',
    d: 'M280,225 L295,218 L310,220 L325,230 L330,245 L335,260 L330,275 L325,290 L320,305 L310,320 L300,340 L290,355 L280,365 L275,355 L270,340 L265,320 L260,305 L255,290 L258,275 L262,260 L265,245 L270,235 Z',
  },
  {
    name: 'Europe',
    d: 'M555,70 L570,65 L585,68 L600,65 L615,70 L625,75 L630,85 L640,80 L650,85 L655,95 L660,105 L655,115 L650,125 L645,130 L640,135 L645,145 L638,150 L630,148 L622,155 L615,148 L608,146 L600,143 L590,145 L585,140 L578,138 L572,130 L568,120 L565,110 L560,100 L555,90 L550,80 Z',
  },
  {
    name: 'UK',
    d: 'M585,100 L595,95 L600,100 L598,110 L592,115 L587,110 Z',
  },
  {
    name: 'Scandinavia',
    d: 'M600,40 L610,35 L625,38 L635,50 L630,60 L620,65 L610,60 L605,55 L600,48 Z',
  },
  {
    name: 'Africa',
    d: 'M560,185 L575,180 L590,183 L605,180 L620,185 L635,190 L650,195 L660,205 L665,220 L668,240 L670,260 L665,280 L660,300 L650,320 L640,335 L625,350 L615,360 L605,365 L595,358 L585,345 L578,330 L570,310 L565,290 L560,270 L558,250 L555,230 L553,215 L555,200 Z',
  },
  {
    name: 'Asia',
    d: 'M670,50 L700,45 L730,40 L760,38 L790,42 L820,40 L850,45 L880,48 L910,42 L940,45 L970,50 L1000,55 L1020,60 L1035,70 L1045,85 L1050,100 L1045,110 L1040,120 L1030,130 L1020,140 L1005,148 L990,155 L980,162 L975,170 L965,175 L955,180 L945,190 L935,195 L920,200 L905,205 L890,200 L875,195 L860,190 L845,185 L830,180 L815,175 L800,168 L785,162 L770,160 L755,163 L740,168 L725,170 L710,168 L700,165 L690,162 L680,158 L672,150 L668,140 L665,130 L662,118 L660,105 L658,90 L660,75 L665,60 Z',
  },
  {
    name: 'India',
    d: 'M810,195 L825,190 L840,195 L845,210 L840,230 L830,245 L820,255 L810,250 L800,240 L795,225 L798,210 Z',
  },
  {
    name: 'Southeast Asia',
    d: 'M950,195 L965,190 L975,198 L980,210 L978,225 L970,235 L960,240 L950,235 L945,225 L948,210 Z',
  },
  {
    name: 'Arabian Peninsula',
    d: 'M730,185 L750,180 L762,185 L768,200 L762,215 L750,225 L738,220 L728,210 L725,198 Z',
  },
  {
    name: 'Japan',
    d: 'M1020,130 L1030,125 L1038,130 L1040,145 L1035,155 L1025,150 L1020,140 Z',
  },
  {
    name: 'Australia',
    d: 'M960,340 L985,335 L1010,340 L1030,350 L1040,365 L1035,380 L1025,395 L1010,400 L990,398 L970,390 L958,375 L955,360 Z',
  },
  {
    name: 'Central America',
    d: 'M240,170 L255,168 L268,175 L275,185 L270,195 L260,200 L248,198 L240,190 L238,180 Z',
  },
];

function generateCurvePath(nodes: { x: number; y: number }[]): string {
  if (nodes.length < 2) return '';
  const parts: string[] = [`M ${nodes[0].x},${nodes[0].y}`];
  for (let i = 1; i < nodes.length; i++) {
    const prev = nodes[i - 1];
    const curr = nodes[i];
    const midX = (prev.x + curr.x) / 2;
    const dy = Math.abs(curr.y - prev.y);
    const curvature = Math.max(15, dy * 0.3);
    const direction = i % 2 === 0 ? -1 : 1;
    const cp1x = prev.x + (curr.x - prev.x) * 0.3;
    const cp1y = prev.y + curvature * direction;
    const cp2x = prev.x + (curr.x - prev.x) * 0.7;
    const cp2y = curr.y - curvature * direction;
    parts.push(`C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`);
  }
  return parts.join(' ');
}

export default function WorldMap() {
  const { selectedInvention, hoveredNode, selectedNode, selectNode, setHoveredNode } =
    useMapStore();

  const routePaths = useMemo(() => {
    return spreadRoutes.map((route) => {
      const invention = inventions.find((i) => i.id === route.inventionId)!;
      const path = generateCurvePath(route.nodes);
      const isSelected = selectedInvention === route.inventionId;
      const isNoneSelected = selectedInvention === null;
      return { route, invention, path, isSelected, isNoneSelected };
    });
  }, [selectedInvention]);

  const visibleNodes = useMemo(() => {
    if (selectedInvention) {
      return allNodes.filter((n) => n.inventionId === selectedInvention);
    }
    return allNodes;
  }, [selectedInvention]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden animate-map-in" style={{ animationDelay: '0.4s' }}>
      <svg
        viewBox="0 0 1200 600"
        className="w-full h-full max-w-[1200px]"
        style={{ filter: 'drop-shadow(0 0 40px rgba(0,0,0,0.3))' }}
      >
        <defs>
          {inventions.map((inv) => (
            <filter key={`glow-${inv.id}`} id={`glow-${inv.id}`}>
              <feGaussianBlur stdDeviation="6" result="coloredBlur" />
              <feFlood floodColor={inv.color} floodOpacity="0.8" result="glowColor" />
              <feComposite in="glowColor" in2="coloredBlur" operator="in" result="softGlow" />
              <feMerge>
                <feMergeNode in="softGlow" />
                <feMergeNode in="softGlow" />
                <feMergeNode in="softGlow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
          {inventions.map((inv) => (
            <filter key={`soft-glow-${inv.id}`} id={`soft-glow-${inv.id}`}>
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feFlood floodColor={inv.color} floodOpacity="0.5" result="glowColor" />
              <feComposite in="glowColor" in2="coloredBlur" operator="in" result="softGlow" />
              <feMerge>
                <feMergeNode in="softGlow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
          <filter id="continent-glow">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="bg-gradient" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#0f1628" />
            <stop offset="100%" stopColor="#070a12" />
          </radialGradient>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(245,230,200,0.03)" strokeWidth="0.5" />
          </pattern>
        </defs>

        <rect width="1200" height="600" fill="url(#bg-gradient)" />
        <rect width="1200" height="600" fill="url(#grid)" />

        {continentPaths.map((continent, idx) => (
          <path
            key={continent.name}
            d={continent.d}
            fill="rgba(245,230,200,0.06)"
            stroke="rgba(245,230,200,0.15)"
            strokeWidth="0.8"
            filter="url(#continent-glow)"
            style={{
              opacity: 0,
              animation: `mapFadeIn 1.5s ease-out ${0.6 + idx * 0.1}s forwards`,
            }}
          />
        ))}

        {routePaths.map(({ route, invention, path, isSelected, isNoneSelected }) => {
          const opacity = isSelected || isNoneSelected ? 1 : 0.15;
          const strokeWidth = isSelected ? 3.5 : isNoneSelected ? 2 : 0.8;

          return (
            <g key={route.inventionId}>
              {isSelected && (
                <path
                  d={path}
                  fill="none"
                  stroke={invention.color}
                  strokeWidth={18}
                  strokeLinecap="round"
                  opacity={0.08}
                />
              )}
              <path
                d={path}
                fill="none"
                stroke={invention.color}
                strokeWidth={strokeWidth + 6}
                strokeLinecap="round"
                opacity={isSelected ? 0.2 : opacity * 0.12}
              />
              <path
                d={path}
                fill="none"
                stroke={invention.strokeColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                opacity={isSelected ? 1 : opacity}
                filter={isSelected ? `url(#glow-${invention.id})` : isNoneSelected ? `url(#soft-glow-${invention.id})` : undefined}
              />
              {(isSelected || isNoneSelected) && (
                <path
                  d={path}
                  fill="none"
                  stroke={invention.color}
                  strokeWidth={isSelected ? 1.5 : 0.8}
                  strokeLinecap="round"
                  strokeDasharray="8 16"
                  opacity={isSelected ? 0.85 : 0.35}
                  className={isSelected ? 'animate-flow' : ''}
                />
              )}
            </g>
          );
        })}

        {visibleNodes.map((node, nodeIdx) => {
          const invention = inventions.find((i) => i.id === node.inventionId)!;
          const isHovered = hoveredNode === node.id;
          const isSelectedNode = selectedNode?.id === node.id;
          const isHighlighted =
            selectedInvention === node.inventionId || selectedInvention === null;
          const nodeRadius = isHovered || isSelectedNode ? 8 : 5;

          return (
            <g
              key={node.id}
              className="cursor-pointer transition-opacity duration-500"
              onClick={() => selectNode(node)}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              style={{
                opacity: isHighlighted ? 1 : 0.15,
                animation: selectedInvention === null
                  ? `fadeUp 0.6s ease-out ${1.2 + nodeIdx * 0.08}s both`
                  : 'none',
              }}
            >
              {(isHovered || isSelectedNode) && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={18}
                  fill={invention.color}
                  opacity={0.12}
                  className="animate-ping-slow"
                />
              )}
              <circle
                cx={node.x}
                cy={node.y}
                r={nodeRadius + 5}
                fill={invention.color}
                opacity={0.1}
              />
              <circle
                cx={node.x}
                cy={node.y}
                r={nodeRadius + 3}
                fill="none"
                stroke={invention.color}
                strokeWidth={1.5}
                opacity={0.4}
              />
              <circle
                cx={node.x}
                cy={node.y}
                r={nodeRadius}
                fill={invention.strokeColor}
                stroke={invention.color}
                strokeWidth={2}
              />
              <circle
                cx={node.x}
                cy={node.y}
                r={nodeRadius - 2.5}
                fill={invention.color}
                opacity={0.9}
              />
              {isHighlighted && (
                <text
                  x={node.x}
                  y={node.y - 16}
                  textAnchor="middle"
                  fill="rgba(10,14,23,0.8)"
                  fontSize="10"
                  fontFamily="'Noto Serif SC', serif"
                  fontWeight="600"
                  stroke="rgba(10,14,23,0.8)"
                  strokeWidth="3"
                  paintOrder="stroke"
                >
                  {node.name}
                </text>
              )}
              {isHighlighted && (
                <text
                  x={node.x}
                  y={node.y - 16}
                  textAnchor="middle"
                  fill={invention.color}
                  fontSize="10"
                  fontFamily="'Noto Serif SC', serif"
                  fontWeight="600"
                >
                  {node.name}
                </text>
              )}
            </g>
          );
        })}

        <text
          x={985}
          y={215}
          fill="rgba(245,230,200,0.25)"
          fontSize="14"
          fontFamily="'Noto Serif SC', serif"
          textAnchor="middle"
        >
          中国
        </text>
        <text
          x={610}
          y={115}
          fill="rgba(245,230,200,0.15)"
          fontSize="12"
          fontFamily="'Noto Serif SC', serif"
          textAnchor="middle"
        >
          欧洲
        </text>
        <text
          x={610}
          y={275}
          fill="rgba(245,230,200,0.15)"
          fontSize="12"
          fontFamily="'Noto Serif SC', serif"
          textAnchor="middle"
        >
          非洲
        </text>
        <text
          x={310}
          y={125}
          fill="rgba(245,230,200,0.12)"
          fontSize="11"
          fontFamily="'Noto Serif SC', serif"
          textAnchor="middle"
        >
          北美
        </text>
        <text
          x={290}
          y={290}
          fill="rgba(245,230,200,0.12)"
          fontSize="11"
          fontFamily="'Noto Serif SC', serif"
          textAnchor="middle"
        >
          南美
        </text>
        <text
          x={980}
          y={370}
          fill="rgba(245,230,200,0.12)"
          fontSize="11"
          fontFamily="'Noto Serif SC', serif"
          textAnchor="middle"
        >
          澳洲
        </text>
      </svg>
    </div>
  );
}
