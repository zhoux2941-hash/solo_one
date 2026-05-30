<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, inject } from 'vue'
import { useCanvasRenderer } from '@/composables/useCanvasRenderer'
import type { Point } from '@/types'
import type { useLissajous } from '@/composables/useLissajous'

type LissajousInstance = ReturnType<typeof useLissajous>

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

const lissajous = inject<LissajousInstance>('lissajous')

const {
  params,
  drawingOptions,
  tracerOptions,
  currentTime,
  isPlaying,
  animationSpeed,
  points,
  getCurrentPoint
} = lissajous!

const {
  init,
  drawLissajous,
  drawTracer,
  exportPNG
} = useCanvasRenderer(canvasRef)

const trailPoints = ref<Point[]>([])
let animationFrameId: number | null = null
let lastTimestamp: number = 0

function resizeCanvas() {
  if (!containerRef.value || !canvasRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const size = Math.min(rect.width, rect.height)
  init(size, size)
}

function updateAnimation(timestamp: number) {
  if (!lastTimestamp) lastTimestamp = timestamp
  const deltaTime = timestamp - lastTimestamp
  lastTimestamp = timestamp

  if (isPlaying.value) {
    currentTime.value += (deltaTime / 1000) * animationSpeed.value * 0.5
  }

  drawLissajous(points.value, drawingOptions.value, '#00f5d4')

  if (tracerOptions.value.enabled) {
    const currentPoint = getCurrentPoint()
    trailPoints.value.push({ ...currentPoint })
    if (trailPoints.value.length > tracerOptions.value.trailLength) {
      trailPoints.value = trailPoints.value.slice(-tracerOptions.value.trailLength)
    }
    drawTracer(currentPoint, trailPoints.value, tracerOptions.value, '#ff006e')
  } else {
    trailPoints.value = []
  }

  animationFrameId = requestAnimationFrame(updateAnimation)
}

function handleExportPNG() {
  exportPNG('lissajous.png')
}

defineExpose({
  exportPNG: handleExportPNG
})

onMounted(async () => {
  await nextTick()
  resizeCanvas()
  animationFrameId = requestAnimationFrame(updateAnimation)
  window.addEventListener('resize', resizeCanvas)
})

onUnmounted(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }
  window.removeEventListener('resize', resizeCanvas)
})

watch(() => [params.value, drawingOptions.value], () => {
  drawLissajous(points.value, drawingOptions.value, '#00f5d4')
}, { deep: true })
</script>

<template>
  <div ref="containerRef" class="canvas-container glass-panel glow-border">
    <canvas
      ref="canvasRef"
      class="lissajous-canvas"
    ></canvas>
  </div>
</template>

<style scoped>
.canvas-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 400px;
  padding: 16px;
  background: rgba(10, 14, 23, 0.8);
  overflow: hidden;
}

.lissajous-canvas {
  max-width: 100%;
  max-height: 100%;
}
</style>
