<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, toRef } from 'vue'
import { Waves } from 'lucide-vue-next'
import { drawGrid, clearCanvas } from '@/utils/canvasUtils'
import type { LissajousParams } from '@/types'

interface Props {
  xWaveformData: { t: number; value: number }[]
  yWaveformData: { t: number; value: number }[]
  currentTime: number
  params: LissajousParams
}

const props = defineProps<Props>()

const xWaveformData = toRef(props, 'xWaveformData')
const yWaveformData = toRef(props, 'yWaveformData')
const currentTime = toRef(props, 'currentTime')
const params = toRef(props, 'params')

const isExpanded = ref(true)
const xCanvasRef = ref<HTMLCanvasElement | null>(null)
const yCanvasRef = ref<HTMLCanvasElement | null>(null)

const WAVEFORM_COLORS = {
  x: '#ff006e',
  y: '#ffbe0b'
}

const CANVAS_WIDTH = 400
const CANVAS_HEIGHT = 120

let animationFrameId: number | null = null

function drawWaveform(
  ctx: CanvasRenderingContext2D,
  data: { t: number; value: number }[],
  color: string,
  currentTimeValue: number
) {
  clearCanvas(ctx, CANVAS_WIDTH, CANVAS_HEIGHT)
  drawGrid(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, 40, 'rgba(255,255,255,0.1)')

  const centerY = CANVAS_HEIGHT / 2
  const amplitude = CANVAS_HEIGHT / 2 - 10

  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.beginPath()

  let highlightX = 0
  let highlightY = 0
  let foundHighlight = false

  for (let i = 0; i < data.length; i++) {
    const point = data[i]
    const x = (i / (data.length - 1)) * CANVAS_WIDTH
    const y = centerY - (point.value / 0.8) * amplitude

    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }

    if (!foundHighlight && i < data.length - 1) {
      const nextPoint = data[i + 1]
      if (point.t <= currentTimeValue && nextPoint.t >= currentTimeValue) {
        const ratio = (currentTimeValue - point.t) / (nextPoint.t - point.t)
        highlightX = x + ratio * (((i + 1) / (data.length - 1)) * CANVAS_WIDTH - x)
        highlightY = y + ratio * (centerY - (nextPoint.value / 0.8) * amplitude - y)
        foundHighlight = true
      }
    }
  }

  ctx.stroke()

  if (foundHighlight) {
    ctx.beginPath()
    ctx.arc(highlightX, highlightY, 6, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = 15
    ctx.fill()
    ctx.shadowBlur = 0
  }
}

function render() {
  if (!isExpanded.value) {
    animationFrameId = requestAnimationFrame(render)
    return
  }

  const xCanvas = xCanvasRef.value
  const yCanvas = yCanvasRef.value

  if (xCanvas && yCanvas) {
    const xCtx = xCanvas.getContext('2d')
    const yCtx = yCanvas.getContext('2d')

    if (xCtx && yCtx) {
      drawWaveform(xCtx, xWaveformData.value, WAVEFORM_COLORS.x, currentTime.value)
      drawWaveform(yCtx, yWaveformData.value, WAVEFORM_COLORS.y, currentTime.value)
    }
  }

  animationFrameId = requestAnimationFrame(render)
}

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

onMounted(() => {
  render()
})

onUnmounted(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }
})

watch(isExpanded, (expanded) => {
  if (expanded) {
    const xCanvas = xCanvasRef.value
    const yCanvas = yCanvasRef.value
    if (xCanvas) {
      const dpr = window.devicePixelRatio || 1
      xCanvas.width = CANVAS_WIDTH * dpr
      xCanvas.height = CANVAS_HEIGHT * dpr
      const ctx = xCanvas.getContext('2d')
      if (ctx) ctx.scale(dpr, dpr)
    }
    if (yCanvas) {
      const dpr = window.devicePixelRatio || 1
      yCanvas.width = CANVAS_WIDTH * dpr
      yCanvas.height = CANVAS_HEIGHT * dpr
      const ctx = yCanvas.getContext('2d')
      if (ctx) ctx.scale(dpr, dpr)
    }
  }
})
</script>

<template>
  <div class="waveform-display bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden">
    <div
      class="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
      @click="toggleExpand"
    >
      <div class="flex items-center gap-2">
        <Waves class="w-5 h-5 text-purple-400" />
        <span class="text-white font-medium">波形显示</span>
      </div>
      <div class="text-gray-400 text-sm">
        {{ isExpanded ? '收起' : '展开' }}
      </div>
    </div>

    <div v-show="isExpanded" class="p-4 pt-0 space-y-4">
      <div class="waveform-item">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: WAVEFORM_COLORS.x }"></div>
          <span class="text-gray-300 text-sm">X轴波形</span>
        </div>
        <canvas
          ref="xCanvasRef"
          :width="CANVAS_WIDTH"
          :height="CANVAS_HEIGHT"
          class="rounded bg-gray-950"
          :style="{ width: CANVAS_WIDTH + 'px', height: CANVAS_HEIGHT + 'px' }"
        ></canvas>
      </div>

      <div class="waveform-item">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: WAVEFORM_COLORS.y }"></div>
          <span class="text-gray-300 text-sm">Y轴波形</span>
        </div>
        <canvas
          ref="yCanvasRef"
          :width="CANVAS_WIDTH"
          :height="CANVAS_HEIGHT"
          class="rounded bg-gray-950"
          :style="{ width: CANVAS_WIDTH + 'px', height: CANVAS_HEIGHT + 'px' }"
        ></canvas>
      </div>
    </div>
  </div>
</template>

<style scoped>
.waveform-display {
  backdrop-filter: blur(10px);
}
</style>
