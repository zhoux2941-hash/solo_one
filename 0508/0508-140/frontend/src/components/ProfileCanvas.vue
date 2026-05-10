<template>
  <div class="profile-canvas-container">
    <div class="canvas-header">
      <h3>轮廓绘制</h3>
      <div class="canvas-tools">
        <el-button size="small" @click="undoLastPoint">撤销</el-button>
        <el-button size="small" type="danger" @click="clearCanvas">清空</el-button>
      </div>
    </div>
    <div class="canvas-wrapper" ref="canvasWrapper">
      <canvas 
        ref="canvas" 
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing"
        @touchstart.prevent="handleTouchStart"
        @touchmove.prevent="handleTouchMove"
        @touchend.prevent="stopDrawing"
      ></canvas>
      <div class="canvas-info">
        <span>点数: {{ profilePoints.length }}</span>
        <span v-if="compareMode" style="color: #67C23A">比对模式</span>
        <span v-if="hasIssue" style="color: #f56c6c">⚠️ 已修复自相交</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { usePotteryStore } from '@/store/pottery'
import { storeToRefs } from 'pinia'
import { processProfile } from '@/utils/profileUtils'

const canvas = ref(null)
const canvasWrapper = ref(null)
const isDrawing = ref(false)
const ctx = ref(null)

const potteryStore = usePotteryStore()
const { profilePoints, compareProfilePoints, compareMode, smoothness } = storeToRefs(potteryStore)

const processedProfile = computed(() => processProfile(profilePoints.value))
const hasIssue = computed(() => processedProfile.value.hasIssue)

const canvasWidth = 350
const canvasHeight = 600
const scale = 2
const offsetX = 50
const centerLineX = canvasWidth / 2

onMounted(() => {
  initCanvas()
  window.addEventListener('resize', initCanvas)
})

watch([profilePoints, compareProfilePoints, smoothness], () => {
  redrawCanvas()
}, { deep: true })

const initCanvas = () => {
  if (!canvas.value || !canvasWrapper.value) return
  
  canvas.value.width = canvasWidth
  canvas.value.height = canvasHeight
  ctx.value = canvas.value.getContext('2d')
  
  redrawCanvas()
}

const redrawCanvas = () => {
  if (!ctx.value) return
  
  ctx.value.clearRect(0, 0, canvasWidth, canvasHeight)
  
  drawGrid()
  drawCenterLine()
  
  if (hasIssue.value && processedProfile.value.issueRegions.length > 0) {
    drawIssueRegions(processedProfile.value.issueRegions)
  }
  
  if (compareMode.value && compareProfilePoints.value.length > 0) {
    drawProfile(compareProfilePoints.value, '#67C23A', 2, true)
  }
  
  if (hasIssue.value && processedProfile.value.sanitized.length > 0) {
    drawProfile(processedProfile.value.sanitized, '#E6A23C', 2, true)
  }
  
  if (profilePoints.value.length > 0) {
    drawProfile(profilePoints.value, hasIssue.value ? '#409EFF' : '#409EFF', 2, false)
    drawPoints(profilePoints.value, '#409EFF')
  }
}

const drawIssueRegions = (regions) => {
  if (!ctx.value || !regions || regions.length === 0) return
  
  regions.forEach(region => {
    const y1 = canvasHeight - region.startY * scale - offsetX
    const y2 = canvasHeight - region.endY * scale - offsetX
    
    const topY = Math.min(y1, y2)
    const bottomY = Math.max(y1, y2)
    const height = bottomY - topY
    
    ctx.value.fillStyle = 'rgba(245, 108, 108, 0.15)'
    ctx.value.fillRect(centerLineX - 80, topY, 160, height)
    
    ctx.value.strokeStyle = 'rgba(245, 108, 108, 0.5)'
    ctx.value.lineWidth = 1
    ctx.value.setLineDash([3, 3])
    
    ctx.value.beginPath()
    ctx.value.moveTo(centerLineX - 80, topY)
    ctx.value.lineTo(centerLineX + 80, topY)
    ctx.value.stroke()
    
    ctx.value.beginPath()
    ctx.value.moveTo(centerLineX - 80, bottomY)
    ctx.value.lineTo(centerLineX + 80, bottomY)
    ctx.value.stroke()
    
    ctx.value.setLineDash([])
  })
}

const drawGrid = () => {
  ctx.value.strokeStyle = '#e0e0e0'
  ctx.value.lineWidth = 0.5
  
  for (let x = 0; x < canvasWidth; x += 50) {
    ctx.value.beginPath()
    ctx.value.moveTo(x, 0)
    ctx.value.lineTo(x, canvasHeight)
    ctx.value.stroke()
  }
  
  for (let y = 0; y < canvasHeight; y += 50) {
    ctx.value.beginPath()
    ctx.value.moveTo(0, y)
    ctx.value.lineTo(canvasWidth, y)
    ctx.value.stroke()
  }
}

const drawCenterLine = () => {
  ctx.value.strokeStyle = '#ff6b6b'
  ctx.value.lineWidth = 1.5
  ctx.value.setLineDash([5, 5])
  
  ctx.value.beginPath()
  ctx.value.moveTo(centerLineX, 0)
  ctx.value.lineTo(centerLineX, canvasHeight)
  ctx.value.stroke()
  
  ctx.value.setLineDash([])
}

const smoothPoints = (points) => {
  if (points.length < 3) return points
  
  const factor = smoothness.value
  const result = []
  
  for (let i = 0; i < points.length; i++) {
    if (i === 0 || i === points.length - 1) {
      result.push(points[i])
      continue
    }
    
    const prev = points[i - 1]
    const curr = points[i]
    const next = points[i + 1]
    
    const newX = prev.x * factor + curr.x * (1 - factor * 2) + next.x * factor
    const newY = prev.y * factor + curr.y * (1 - factor * 2) + next.y * factor
    
    result.push({ x: newX, y: newY })
  }
  
  return result
}

const drawProfile = (points, color, lineWidth, dashed = false) => {
  if (points.length < 2) return
  
  const displayPoints = smoothPoints(points)
  
  ctx.value.strokeStyle = color
  ctx.value.lineWidth = lineWidth
  if (dashed) {
    ctx.value.setLineDash([5, 5])
  }
  
  ctx.value.beginPath()
  ctx.value.moveTo(centerLineX - displayPoints[0].x * scale, canvasHeight - displayPoints[0].y * scale - offsetX)
  
  for (let i = 1; i < displayPoints.length; i++) {
    const x = centerLineX - displayPoints[i].x * scale
    const y = canvasHeight - displayPoints[i].y * scale - offsetX
    ctx.value.lineTo(x, y)
  }
  
  ctx.value.stroke()
  ctx.value.setLineDash([])
}

const drawPoints = (points, color) => {
  ctx.value.fillStyle = color
  
  for (let i = 0; i < points.length; i++) {
    const x = centerLineX - points[i].x * scale
    const y = canvasHeight - points[i].y * scale - offsetX
    
    ctx.value.beginPath()
    ctx.value.arc(x, y, 3, 0, Math.PI * 2)
    ctx.value.fill()
  }
}

const getCanvasPoint = (event) => {
  const rect = canvas.value.getBoundingClientRect()
  const clientX = event.touches ? event.touches[0].clientX : event.clientX
  const clientY = event.touches ? event.touches[0].clientY : event.clientY
  
  const x = (centerLineX - (clientX - rect.left)) / scale
  const y = (canvasHeight - (clientY - rect.top) - offsetX) / scale
  
  return { x: Math.max(0, x), y: Math.max(0, y) }
}

const startDrawing = (event) => {
  isDrawing.value = true
  const point = getCanvasPoint(event)
  potteryStore.addProfilePoint(point)
}

const draw = (event) => {
  if (!isDrawing.value) return
  
  const point = getCanvasPoint(event)
  
  if (profilePoints.value.length > 0) {
    const lastPoint = profilePoints.value[profilePoints.value.length - 1]
    const dist = Math.sqrt(
      Math.pow(point.x - lastPoint.x, 2) + 
      Math.pow(point.y - lastPoint.y, 2)
    )
    
    if (dist > 3) {
      potteryStore.addProfilePoint(point)
    }
  }
}

const stopDrawing = () => {
  isDrawing.value = false
}

const handleTouchStart = (event) => {
  startDrawing(event)
}

const handleTouchMove = (event) => {
  draw(event)
}

const undoLastPoint = () => {
  if (profilePoints.value.length > 0) {
    potteryStore.setProfilePoints(profilePoints.value.slice(0, -1))
  }
}

const clearCanvas = () => {
  potteryStore.clearProfilePoints()
}
</script>

<style scoped>
.profile-canvas-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.canvas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.canvas-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.canvas-tools {
  display: flex;
  gap: 10px;
}

.canvas-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
}

canvas {
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: crosshair;
}

.canvas-info {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #666;
}
</style>
