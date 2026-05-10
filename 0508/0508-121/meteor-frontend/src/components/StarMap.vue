<template>
  <div class="star-map-container">
    <svg :width="width" :height="height" class="star-map" @click="handleClick">
      <defs>
        <radialGradient id="bgGradient" cx="50%" cy="50%" r="75%">
          <stop offset="0%" style="stop-color:#0f0f2a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#000008;stop-opacity:1" />
        </radialGradient>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#fbbf24" />
        </marker>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <rect :width="width" :height="height" fill="url(#bgGradient)" />

      <g class="grid-lines" stroke="rgba(100, 100, 150, 0.2)" stroke-width="1">
        <line v-for="i in 12" :key="'ra'+i" 
              :x1="mapRA((i-1)*30)" :y1="0"
              :x2="mapRA((i-1)*30)" :y2="height" />
        <line v-for="i in 7" :key="'dec'+i"
              :x1="0" :y1="mapDec((i-1)*30 - 90)"
              :x2="width" :y2="mapDec((i-1)*30 - 90)" />
      </g>

      <g class="constellation-boundaries">
        <g v-for="c in constellations" :key="c.name" 
           :transform="`translate(${mapRA((c.minRA + c.maxRA) / 2)}, ${mapDec((c.minDec + c.maxDec) / 2)})`"
           @click="selectConstellation(c)">
          <rect :x="mapRA(c.minRA) - mapRA((c.minRA + c.maxRA) / 2)"
                :y="mapDec(c.maxDec) - mapDec((c.minDec + c.maxDec) / 2)"
                :width="(c.maxRA - c.minRA) * (width - 80) / 360"
                :height="(c.maxDec - c.minDec) * (height - 60) / 180"
                fill="rgba(124, 58, 237, 0.05)"
                stroke="rgba(124, 58, 237, 0.2)"
                stroke-width="1"
                rx="4"
                class="constellation-rect" />
          <text :text-anchor="middle" 
                :dominant-baseline="middle"
                class="constellation-label"
                fill="rgba(160, 174, 192, 0.6)"
                font-size="11">
            {{ c.chineseName }}
          </text>
        </g>
      </g>

      <g class="axes-labels">
        <text v-for="i in 13" :key="'rax'+i"
              :x="mapRA((i-1)*30)"
              :y="height - 8"
              fill="rgba(160, 174, 192, 0.5)"
              font-size="10"
              text-anchor="middle">
          {{ (i-1)*30 }}°
        </text>
        <text v-for="i in 7" :key="'decx'+i"
              :x="8"
              :y="mapDec((i-1)*30 - 90) + 4"
              fill="rgba(160, 174, 192, 0.5)"
              font-size="10">
          {{ (i-1)*30 - 90 }}°
        </text>
      </g>

      <g class="background-stars">
        <circle v-for="i in 100" :key="'star'+i"
                :cx="stars[i].x"
                :cy="stars[i].y"
                :r="stars[i].r"
                fill="white"
                :opacity="stars[i].opacity" />
      </g>

      <g class="trajectories" v-if="records && records.length">
        <template v-for="(r, i) in records" :key="'traj'+i">
          <line v-if="hasTrajectory(r)"
                :x1="mapRA(r.trajectoryStartRA)"
                :y1="mapDec(r.trajectoryStartDec)"
                :x2="mapRA(r.trajectoryEndRA)"
                :y2="mapDec(r.trajectoryEndDec)"
                :stroke="getColor(r.color)"
                stroke-width="2"
                stroke-opacity="0.8"
                marker-end="url(#arrowhead)"
                class="trajectory-line" />
          <line v-if="showExtended && hasTrajectory(r)"
                :x1="mapRA(r.trajectoryEndRA)"
                :y1="mapDec(r.trajectoryEndDec)"
                :x2="mapRA(extendPoint(r).x)"
                :y2="mapDec(extendPoint(r).y)"
                :stroke="getColor(r.color)"
                stroke-width="1.5"
                stroke-dasharray="5,3"
                stroke-opacity="0.5"
                class="extended-line" />
          <circle v-if="hasTrajectory(r)"
                  :cx="mapRA(r.trajectoryStartRA)"
                  :cy="mapDec(r.trajectoryStartDec)"
                  r="5"
                  :fill="getColor(r.color)"
                  class="start-point" />
        </template>
      </g>

      <g class="radiant-point" v-if="radiantPoint">
        <circle :cx="mapRA(radiantPoint.ra)"
                :cy="mapDec(radiantPoint.dec)"
                r="12"
                fill="none"
                stroke="#ef4444"
                stroke-width="2"
                opacity="0.5"
                class="radiant-pulse">
          <animate attributeName="r" values="12;20;12" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle :cx="mapRA(radiantPoint.ra)"
                :cy="mapDec(radiantPoint.dec)"
                r="8"
                fill="#ef4444"
                filter="url(#glow)"
                class="radiant-core" />
        <text :x="mapRA(radiantPoint.ra)"
              :y="mapDec(radiantPoint.dec) - 18"
              fill="#f87171"
              font-size="12"
              font-weight="bold"
              text-anchor="middle">
          ★ {{ radiantPoint.constellation }}
        </text>
        <text :x="mapRA(radiantPoint.ra)"
              :y="mapDec(radiantPoint.dec) + 28"
              fill="rgba(248, 113, 113, 0.8)"
              font-size="10"
              text-anchor="middle">
          RA: {{ radiantPoint.ra?.toFixed(1) }}°, Dec: {{ radiantPoint.dec?.toFixed(1) }}°
        </text>
      </g>

      <g v-if="selectedPoint">
        <circle :cx="selectedPoint.x"
                :cy="selectedPoint.y"
                r="5"
                fill="#a78bfa" />
        <text :x="selectedPoint.x + 10"
              :y="selectedPoint.y - 10"
              fill="#a78bfa"
              font-size="11">
          RA: {{ unmapRA(selectedPoint.x).toFixed(1) }}°, Dec: {{ unmapDec(selectedPoint.y).toFixed(1) }}°
        </text>
      </g>
    </svg>

    <div class="map-info">
      <div class="info-item">
        <span class="info-label">横轴：</span>
        <span class="info-value">赤经 RA (0° - 360°)</span>
      </div>
      <div class="info-item">
        <span class="info-label">纵轴：</span>
        <span class="info-value">赤纬 Dec (-90° - +90°)</span>
      </div>
      <div class="legend">
        <span class="legend-item">
          <span class="legend-line" style="background: #fbbf24"></span>
          流星轨迹
        </span>
        <span class="legend-item" v-if="showExtended">
          <span class="legend-line dashed"></span>
          延长线
        </span>
        <span class="legend-item">
          <span class="legend-dot red"></span>
          辐射点
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  width: { type: Number, default: 800 },
  height: { type: Number, default: 500 },
  records: { type: Array, default: () => [] },
  radiantPoint: { type: Object, default: null },
  showExtended: { type: Boolean, default: true }
})

const emit = defineEmits(['pointSelect', 'constellationSelect'])

const selectedPoint = ref(null)
const stars = ref([])

const constellations = [
  { name: 'Orion', chineseName: '猎户', minRA: 75, maxRA: 90, minDec: -10, maxDec: 20 },
  { name: 'Canis Major', chineseName: '大犬', minRA: 90, maxRA: 115, minDec: -50, maxDec: -10 },
  { name: 'Taurus', chineseName: '金牛', minRA: 40, maxRA: 75, minDec: 0, maxDec: 35 },
  { name: 'Gemini', chineseName: '双子', minRA: 95, maxRA: 125, minDec: 10, maxDec: 35 },
  { name: 'Leo', chineseName: '狮子', minRA: 135, maxRA: 180, minDec: -10, maxDec: 35 },
  { name: 'Ursa Major', chineseName: '大熊', minRA: 150, maxRA: 250, minDec: 28, maxDec: 90 },
  { name: 'Ursa Minor', chineseName: '小熊', minRA: 0, maxRA: 360, minDec: 60, maxDec: 90 },
  { name: 'Lyra', chineseName: '天琴', minRA: 270, maxRA: 295, minDec: 25, maxDec: 48 },
  { name: 'Cygnus', chineseName: '天鹅', minRA: 290, maxRA: 320, minDec: 25, maxDec: 65 },
  { name: 'Aquarius', chineseName: '宝瓶', minRA: 305, maxRA: 355, minDec: -25, maxDec: 3 },
  { name: 'Pegasus', chineseName: '飞马', minRA: 320, maxRA: 360, minDec: 2, maxDec: 35 },
  { name: 'Perseus', chineseName: '英仙', minRA: 20, maxRA: 70, minDec: 30, maxDec: 60 },
  { name: 'Cassiopeia', chineseName: '仙后', minRA: 0, maxRA: 85, minDec: 45, maxDec: 78 },
  { name: 'Draco', chineseName: '天龙', minRA: 120, maxRA: 220, minDec: 50, maxDec: 85 },
  { name: 'Hercules', chineseName: '武仙', minRA: 220, maxRA: 265, minDec: -5, maxDec: 50 },
  { name: 'Virgo', chineseName: '室女', minRA: 170, maxRA: 215, minDec: -25, maxDec: 15 },
  { name: 'Libra', chineseName: '天秤', minRA: 215, maxRA: 240, minDec: -30, maxDec: 0 },
  { name: 'Scorpius', chineseName: '天蝎', minRA: 230, maxRA: 265, minDec: -45, maxDec: 0 },
  { name: 'Sagittarius', chineseName: '人马', minRA: 255, maxRA: 300, minDec: -45, maxDec: -10 },
  { name: 'Capricornus', chineseName: '摩羯', minRA: 295, maxRA: 325, minDec: -35, maxDec: -10 },
  { name: 'Aries', chineseName: '白羊', minRA: 20, maxRA: 55, minDec: 0, maxDec: 30 },
  { name: 'Cancer', chineseName: '巨蟹', minRA: 115, maxRA: 140, minDec: 5, maxDec: 30 },
  { name: 'Bootes', chineseName: '牧夫', minRA: 195, maxRA: 240, minDec: 0, maxDec: 55 },
  { name: 'Ophiuchus', chineseName: '蛇夫', minRA: 235, maxRA: 270, minDec: -30, maxDec: 20 }
]

const padding = { left: 40, right: 40, top: 30, bottom: 30 }

const isValidNumber = (val) => {
  return val != null && typeof val === 'number' && !isNaN(val) && isFinite(val)
}

const safeNumber = (val, fallback) => {
  return isValidNumber(val) ? val : fallback
}

const normalizeRA = (ra) => {
  if (!isValidNumber(ra)) return 180
  let result = ra
  while (result < 0) result += 360
  while (result >= 360) result -= 360
  return result
}

const clampDec = (dec) => {
  if (!isValidNumber(dec)) return 0
  return Math.max(-90, Math.min(90, dec))
}

const mapRA = (ra) => {
  if (!isValidNumber(ra)) return 0
  const normalizedRA = normalizeRA(ra)
  return padding.left + normalizedRA * (props.width - padding.left - padding.right) / 360
}

const mapDec = (dec) => {
  if (!isValidNumber(dec)) return props.height / 2
  const normalizedDec = clampDec(dec)
  return padding.top + (90 - normalizedDec) * (props.height - padding.top - padding.bottom) / 180
}

const unmapRA = (x) => {
  return (x - padding.left) * 360 / (props.width - padding.left - padding.right)
}

const unmapDec = (y) => {
  return 90 - (y - padding.top) * 180 / (props.height - padding.top - padding.bottom)
}

const hasTrajectory = (r) => {
  return r && 
         isValidNumber(r.trajectoryStartRA) && 
         isValidNumber(r.trajectoryStartDec) &&
         isValidNumber(r.trajectoryEndRA) && 
         isValidNumber(r.trajectoryEndDec) &&
         !isSamePoint(
           r.trajectoryStartRA, r.trajectoryStartDec,
           r.trajectoryEndRA, r.trajectoryEndDec
         )
}

const isSamePoint = (ra1, dec1, ra2, dec2) => {
  let dRA = Math.abs(ra1 - ra2)
  if (dRA > 180) dRA = 360 - dRA
  const dDec = Math.abs(dec1 - dec2)
  return dRA < 0.1 && dDec < 0.1
}

const getColor = (color) => {
  const colorMap = {
    '白': '#ffffff',
    '黄': '#facc15',
    '蓝': '#60a5fa',
    '红': '#f87171'
  }
  return colorMap[color] || '#fbbf24'
}

const extendPoint = (r) => {
  if (!hasTrajectory(r)) return { x: 0, y: 0 }
  
  const dx = r.trajectoryStartRA - r.trajectoryEndRA
  const dy = r.trajectoryStartDec - r.trajectoryEndDec
  const len = Math.sqrt(dx * dx + dy * dy)
  if (!isValidNumber(len) || len < 0.001) {
    return { x: r.trajectoryStartRA, y: r.trajectoryStartDec }
  }
  
  const extendRatio = 5
  const newX = r.trajectoryEndRA + dx * extendRatio
  const newY = r.trajectoryEndDec + dy * extendRatio
  
  if (!isValidNumber(newX) || !isValidNumber(newY)) {
    return { x: r.trajectoryStartRA, y: r.trajectoryStartDec }
  }
  
  return { x: newX, y: newY }
}

const handleClick = (event) => {
  const svg = event.currentTarget
  const rect = svg.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  selectedPoint.value = { x, y }
  
  const ra = unmapRA(x)
  const dec = unmapDec(y)
  emit('pointSelect', { ra, dec, x, y })
}

const selectConstellation = (c) => {
  emit('constellationSelect', c)
}

onMounted(() => {
  const backgroundStars = []
  for (let i = 0; i < 100; i++) {
    backgroundStars.push({
      x: Math.random() * props.width,
      y: Math.random() * props.height,
      r: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.3
    })
  }
  stars.value = backgroundStars
})
</script>

<style scoped>
.star-map-container {
  background: #0a0a1a;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #3a3a6a;
}

.star-map {
  display: block;
  cursor: crosshair;
}

.constellation-rect {
  cursor: pointer;
  transition: all 0.2s;
}

.constellation-rect:hover {
  fill: rgba(124, 58, 237, 0.15);
  stroke: rgba(124, 58, 237, 0.5);
}

.constellation-label {
  pointer-events: none;
}

.trajectory-line {
  filter: drop-shadow(0 0 2px currentColor);
}

.map-info {
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.info-item {
  font-size: 0.875rem;
  color: #a0aec0;
}

.info-label {
  color: #718096;
}

.legend {
  display: flex;
  gap: 1.5rem;
  font-size: 0.875rem;
  color: #a0aec0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-line {
  width: 20px;
  height: 2px;
  background: #fbbf24;
}

.legend-line.dashed {
  background: none;
  border-top: 2px dashed rgba(251, 191, 36, 0.5);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-dot.red {
  background: #ef4444;
  box-shadow: 0 0 6px #ef4444;
}

.radiant-core {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
