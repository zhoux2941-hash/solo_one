import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/store/useStore'
import { highways } from '@/data/highways'
import { serviceAreas } from '@/data/serviceAreas'

const CHINA_OUTLINE = 'M180,140 C200,100 280,70 380,60 C450,55 520,60 580,70 C650,80 720,95 770,110 C810,120 840,140 850,170 C860,200 850,230 830,260 C820,280 800,310 790,340 C780,370 770,400 760,420 C750,440 730,470 710,500 C690,530 670,550 650,570 C630,590 610,610 590,630 C570,650 550,670 530,690 C510,710 480,720 450,720 C420,720 390,710 370,700 C340,690 310,680 280,660 C250,640 220,610 200,580 C180,550 160,520 150,490 C140,460 130,430 120,400 C110,370 100,340 100,310 C100,280 110,250 130,220 C150,190 160,160 180,140 Z'

const MAJOR_CITIES = [
  { name: '北京', x: 640, y: 180 },
  { name: '上海', x: 760, y: 390 },
  { name: '广州', x: 580, y: 640 },
  { name: '深圳', x: 590, y: 660 },
  { name: '成都', x: 400, y: 475 },
  { name: '重庆', x: 440, y: 460 },
  { name: '西安', x: 490, y: 350 },
  { name: '武汉', x: 570, y: 435 },
  { name: '杭州', x: 745, y: 420 },
  { name: '南京', x: 720, y: 375 },
  { name: '沈阳', x: 755, y: 150 },
  { name: '昆明', x: 370, y: 580 },
  { name: '乌鲁木齐', x: 140, y: 170 },
  { name: '兰州', x: 370, y: 320 },
  { name: '哈尔滨', x: 780, y: 100 },
]

const NOISE_DOTS = Array.from({ length: 40 }).map(() => ({
  cx: Math.random() * 100,
  cy: Math.random() * 100,
  r: Math.random() * 0.8 + 0.2,
  opacity: Math.random() * 0.03 + 0.01,
}))

function createGridLines() {
  const lines = []
  for (let x = 0; x <= 1000; x += 50) {
    lines.push(<line key={`v-${x}`} x1={x} y1={0} x2={x} y2={800} stroke="#143848" strokeWidth="0.5" strokeDasharray="2,6" opacity="0.4" />)
  }
  for (let y = 0; y <= 800; y += 50) {
    lines.push(<line key={`h-${y}`} x1={0} y1={y} x2={1000} y2={y} stroke="#143848" strokeWidth="0.5" strokeDasharray="2,6" opacity="0.4" />)
  }
  return lines
}

function getPathMidpoint(pathStr: string): { x: number; y: number } {
  const nums = pathStr.match(/[\d.]+/g)?.map(Number) || []
  const xs = nums.filter((_, i) => i % 2 === 0)
  const ys = nums.filter((_, i) => i % 2 === 1)
  return {
    x: xs.reduce((a, b) => a + b, 0) / xs.length,
    y: ys.reduce((a, b) => a + b, 0) / ys.length,
  }
}

function HighwayMap() {
  const getFilteredServiceAreaIds = useStore((s) => s.getFilteredServiceAreaIds)
  const selectedServiceAreaId = useStore((s) => s.selectedServiceAreaId)
  const setSelectedServiceAreaId = useStore((s) => s.setSelectedServiceAreaId)
  
  const filteredIds = useMemo(() => getFilteredServiceAreaIds(), [getFilteredServiceAreaIds])
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const handleMarkerClick = useCallback((id: string) => {
    setSelectedServiceAreaId(id)
  }, [setSelectedServiceAreaId])

  const filteredServiceAreas = useMemo(
    () => serviceAreas.filter(sa => filteredIds.includes(sa.id)),
    [filteredIds]
  )

  const highwayMap = useMemo(() => {
    return highways.reduce<Record<string, typeof highways[number]>>((acc, h) => {
      acc[h.id] = h
      return acc
    }, {})
  }, [])

  return (
    <svg viewBox="0 0 1000 800" style={{ width: '100%', height: '100%' }}>
      <defs>
        <radialGradient id="mapBgGradient" cx="50%" cy="45%" r="75%">
          <stop offset="0%" stopColor="#0F4C5C" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#0a3a4a" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#072028" stopOpacity="1" />
        </radialGradient>

        <linearGradient id="landGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#124a5a" />
          <stop offset="30%" stopColor="#0e3f4e" />
          <stop offset="60%" stopColor="#0b3745" />
          <stop offset="100%" stopColor="#082a36" />
        </linearGradient>

        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <pattern id="noise" patternUnits="userSpaceOnUse" width="100" height="100">
          <rect width="100" height="100" fill="transparent" />
          {NOISE_DOTS.map((dot, i) => (
            <circle
              key={i}
              cx={dot.cx}
              cy={dot.cy}
              r={dot.r}
              fill="#ffffff"
              opacity={dot.opacity}
            />
          ))}
        </pattern>

        <radialGradient id="cityGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1000" height="800" fill="url(#mapBgGradient)" />

      <rect width="1000" height="800" fill="url(#noise)" opacity="0.6" />

      <g opacity="0.5">
        {createGridLines()}
      </g>

      <g filter="url(#softGlow)">
        <path d={CHINA_OUTLINE} fill="none" stroke="#1a5a70" strokeWidth="6" opacity="0.4" />
      </g>

      <path d={CHINA_OUTLINE} fill="url(#landGradient)" stroke="#2a6a80" strokeWidth="2" />

      <path d={CHINA_OUTLINE} fill="none" stroke="#E36414" strokeWidth="1" strokeDasharray="8,4" opacity="0.15" />

      <g>
        {MAJOR_CITIES.map((city) => (
          <g key={city.name}>
            <circle cx={city.x} cy={city.y} r="12" fill="url(#cityGlow)" opacity="0.5" />
            <circle cx={city.x} cy={city.y} r="3.5" fill="#E36414" stroke="#fff" strokeWidth="1.5" />
            <text
              x={city.x + 6}
              y={city.y + 3}
              fill="#c9d6db"
              fontSize="10"
              fontWeight="500"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
            >
              {city.name}
            </text>
          </g>
        ))}
      </g>

      {highways.map((highway) => {
        const mid = getPathMidpoint(highway.path)
        return (
          <g key={highway.id}>
            <motion.path
              d={highway.path}
              stroke={highway.color}
              strokeWidth={10}
              strokeLinecap="round"
              fill="none"
              opacity="0.2"
              filter="url(#softGlow)"
              initial={{ strokeDashoffset: 2000, strokeDasharray: 2000 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 2, ease: 'easeInOut' }}
            />
            <motion.path
              d={highway.path}
              stroke={highway.color}
              strokeWidth={4}
              strokeLinecap="round"
              fill="none"
              initial={{ strokeDashoffset: 2000, strokeDasharray: 2000 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 2, ease: 'easeInOut' }}
            />
            <text
              x={mid.x}
              y={mid.y - 12}
              textAnchor="middle"
              fill={highway.color}
              fontSize="13"
              fontWeight="bold"
              style={{ textShadow: '0 0 6px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,0.8)' }}
            >
              {highway.code}
            </text>
          </g>
        )
      })}

      {filteredServiceAreas.map((sa) => {
        const highway = highwayMap[sa.highwayId]
        const color = highway?.color ?? '#ffffff'
        const isSelected = selectedServiceAreaId === sa.id

        return (
          <g key={sa.id}>
            <motion.circle
              cx={sa.svgX}
              cy={sa.svgY}
              r={7}
              fill={color}
              stroke="white"
              strokeWidth={2}
              onClick={() => handleMarkerClick(sa.id)}
              onHoverStart={() => setHoveredId(sa.id)}
              onHoverEnd={() => setHoveredId(null)}
              style={{ cursor: 'pointer', transformOrigin: `${sa.svgX}px ${sa.svgY}px` }}
              animate={{
                scale: isSelected ? 1.3 : 1,
              }}
              whileHover={{ scale: isSelected ? 1.4 : 1.2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            />
            {isSelected && (
              <motion.circle
                cx={sa.svgX}
                cy={sa.svgY}
                r={10}
                fill="none"
                stroke={color}
                strokeWidth={2}
                animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0.3, 0.8] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
            <AnimatePresence>
              {hoveredId === sa.id && (
                <foreignObject x={sa.svgX - 60} y={sa.svgY - 40} width={120} height={30}>
                  <div
                    style={{
                      background: 'rgba(0,0,0,0.8)',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {sa.name}
                  </div>
                </foreignObject>
              )}
            </AnimatePresence>
          </g>
        )
      })}
    </svg>
  )
}

export default React.memo(HighwayMap)
