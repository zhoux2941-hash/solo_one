import { useMemo } from 'react'
import type { LandmarkDeviation } from '../types'

interface HeatmapProps {
  deviations: LandmarkDeviation[]
  width?: number
  height?: number
}

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]
]

export function Heatmap({ deviations, width = 300, height = 300 }: HeatmapProps) {
  const handPoints = useMemo(() => {
    const basePoints = [
      { x: 0.5, y: 0.7 },
      { x: 0.42, y: 0.6 },
      { x: 0.35, y: 0.5 },
      { x: 0.3, y: 0.42 },
      { x: 0.25, y: 0.35 },
      { x: 0.5, y: 0.45 },
      { x: 0.48, y: 0.3 },
      { x: 0.46, y: 0.2 },
      { x: 0.44, y: 0.12 },
      { x: 0.55, y: 0.45 },
      { x: 0.56, y: 0.28 },
      { x: 0.57, y: 0.18 },
      { x: 0.58, y: 0.1 },
      { x: 0.6, y: 0.48 },
      { x: 0.62, y: 0.32 },
      { x: 0.64, y: 0.22 },
      { x: 0.66, y: 0.14 },
      { x: 0.5, y: 0.65 },
      { x: 0.46, y: 0.58 },
      { x: 0.44, y: 0.52 },
      { x: 0.42, y: 0.46 }
    ]

    return basePoints.map(p => ({
      x: p.x * width,
      y: p.y * height
    }))
  }, [width, height])

  const getDeviationColor = (deviation: number) => {
    if (deviation > 0.15) return '#ef4444'
    if (deviation > 0.08) return '#f59e0b'
    return '#22c55e'
  }

  const getDeviationLevel = (deviation: number) => {
    if (deviation > 0.15) return 'high'
    if (deviation > 0.08) return 'medium'
    return 'low'
  }

  const maxDeviation = Math.max(...deviations.map(d => d.average_deviation), 0.01)

  return (
    <div className="relative">
      <svg width={width} height={height} className="bg-slate-100 rounded-lg">
        {HAND_CONNECTIONS.map(([start, end], idx) => {
          const startPoint = handPoints[start]
          const endPoint = handPoints[end]
          const startDeviation = deviations[start]?.average_deviation || 0
          const endDeviation = deviations[end]?.average_deviation || 0
          const avgDeviation = (startDeviation + endDeviation) / 2

          return (
            <line
              key={idx}
              x1={startPoint.x}
              y1={startPoint.y}
              x2={endPoint.x}
              y2={endPoint.y}
              stroke={getDeviationColor(avgDeviation)}
              strokeWidth={3}
              strokeLinecap="round"
            />
          )
        })}

        {handPoints.map((point, idx) => {
          const deviation = deviations[idx]?.average_deviation || 0
          const level = getDeviationLevel(deviation)
          const size = 6 + (deviation / maxDeviation) * 8

          return (
            <g key={idx}>
              <circle
                cx={point.x}
                cy={point.y}
                r={size}
                fill={getDeviationColor(deviation)}
                opacity={0.8}
              />
              <text
                x={point.x}
                y={point.y + size + 12}
                textAnchor="middle"
                fontSize="8"
                fill="#64748b"
              >
                {idx}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="absolute top-2 right-2 bg-white/90 rounded-lg p-2 text-xs">
        <div className="font-medium text-slate-600 mb-1">偏差图例</div>
        <div className="flex items-center gap-1 mb-1">
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
          <span className="text-slate-600">标准</span>
        </div>
        <div className="flex items-center gap-1 mb-1">
          <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
          <span className="text-slate-600">中等偏差</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-500"></span>
          <span className="text-slate-600">较大偏差</span>
        </div>
      </div>
    </div>
  )
}
