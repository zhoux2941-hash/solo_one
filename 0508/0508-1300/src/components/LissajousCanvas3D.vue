<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, inject } from 'vue'
import { createLissajous3DScene, generatePoints3D } from '@/composables/useLissajous3D'
import type { Point3D, View3DOptions } from '@/types'
import type { useLissajous } from '@/composables/useLissajous'

type LissajousInstance = ReturnType<typeof useLissajous>

const containerRef = ref<HTMLDivElement | null>(null)

const lissajous = inject<LissajousInstance>('lissajous')

const {
  params,
  tracerOptions,
  currentTime,
  isPlaying,
  animationSpeed,
} = lissajous!

const view3DOptions = ref<View3DOptions>({
  enabled: true,
  tubeRadius: 0.015,
  showAxes3D: true,
  showGrid3D: true,
  autoRotate: true,
  depthScale: 0.5,
})

let scene3D: ReturnType<typeof createLissajous3DScene> | null = null
let animationFrameId: number | null = null
let lastTimestamp: number = 0
const trailPoints3D = ref<Point3D[]>([])

function initScene() {
  if (!containerRef.value) return
  scene3D = createLissajous3DScene(
    containerRef.value,
    view3DOptions.value,
    params.value
  )
}

function updateAnimation(timestamp: number) {
  if (!lastTimestamp) lastTimestamp = timestamp
  const deltaTime = timestamp - lastTimestamp
  lastTimestamp = timestamp

  if (isPlaying.value) {
    currentTime.value += (deltaTime / 1000) * animationSpeed.value * 0.5
  }

  if (tracerOptions.value.enabled) {
    const pts3d = generatePoints3D(params.value, view3DOptions.value.depthScale)
    const totalLen = pts3d.length
    if (totalLen > 0) {
      const { fx, fy } = params.value
      const period = lcm(Math.round(fx), Math.round(fy)) / Math.min(fx, fy)
      const tNorm = (currentTime.value % period) / period
      const idx = Math.floor(tNorm * (totalLen - 1))
      const currentPt3d = pts3d[Math.min(idx, totalLen - 1)]

      trailPoints3D.value.push({ ...currentPt3d })
      if (trailPoints3D.value.length > tracerOptions.value.trailLength) {
        trailPoints3D.value = trailPoints3D.value.slice(-tracerOptions.value.trailLength)
      }

      scene3D?.updateTracer(currentPt3d, trailPoints3D.value)
    }
  } else {
    trailPoints3D.value = []
    scene3D?.updateTracer(null, [])
  }

  scene3D?.render()
  animationFrameId = requestAnimationFrame(updateAnimation)
}

function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0
  return Math.abs(a * b) / gcd(Math.abs(a), Math.abs(b))
}

function gcd(a: number, b: number): number {
  while (b !== 0) {
    const temp = b
    b = a % b
    a = temp
  }
  return a
}

function handleResize() {
  scene3D?.resize()
}

function exportPNG() {
  if (!scene3D) return
  scene3D.render()
  const dataUrl = scene3D.renderer.domElement.toDataURL('image/png')
  const link = document.createElement('a')
  link.download = 'lissajous-3d.png'
  link.href = dataUrl
  link.click()
}

defineExpose({
  exportPNG,
  view3DOptions,
})

onMounted(async () => {
  await nextTick()
  initScene()
  animationFrameId = requestAnimationFrame(updateAnimation)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }
  window.removeEventListener('resize', handleResize)
  scene3D?.dispose()
  scene3D = null
})

watch(
  () => params.value,
  () => {
    scene3D?.updateCurve(params.value)
    trailPoints3D.value = []
  },
  { deep: true }
)

watch(
  () => view3DOptions.value,
  () => {
    if (!scene3D) return
    scene3D.controls.autoRotate = view3DOptions.value.autoRotate
    scene3D.updateAxes(view3DOptions.value.showAxes3D)
    scene3D.updateGrid(view3DOptions.value.showGrid3D)
    scene3D.updateCurve(params.value)
  },
  { deep: true }
)
</script>

<template>
  <div class="canvas3d-container">
    <div ref="containerRef" class="three-canvas"></div>

    <div class="controls-3d">
      <div class="control-row">
        <label class="control-label">管道粗细</label>
        <input
          type="range"
          :value="view3DOptions.tubeRadius"
          min="0.005"
          max="0.08"
          step="0.005"
          class="control-slider"
          @input="(e) => view3DOptions.tubeRadius = parseFloat((e.target as HTMLInputElement).value)"
        />
      </div>
      <div class="control-row">
        <label class="control-label">深度缩放</label>
        <input
          type="range"
          :value="view3DOptions.depthScale"
          min="0.1"
          max="2"
          step="0.1"
          class="control-slider"
          @input="(e) => view3DOptions.depthScale = parseFloat((e.target as HTMLInputElement).value)"
        />
      </div>
      <div class="control-toggles">
        <button
          class="toggle-btn"
          :class="{ active: view3DOptions.autoRotate }"
          @click="view3DOptions.autoRotate = !view3DOptions.autoRotate"
        >自转</button>
        <button
          class="toggle-btn"
          :class="{ active: view3DOptions.showAxes3D }"
          @click="view3DOptions.showAxes3D = !view3DOptions.showAxes3D"
        >坐标轴</button>
        <button
          class="toggle-btn"
          :class="{ active: view3DOptions.showGrid3D }"
          @click="view3DOptions.showGrid3D = !view3DOptions.showGrid3D"
        >网格</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.canvas3d-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(10, 14, 23, 0.8);
}

.three-canvas {
  width: 100%;
  height: 100%;
}

.three-canvas :deep(canvas) {
  display: block;
  border-radius: 16px;
}

.controls-3d {
  position: absolute;
  bottom: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 18px;
  background: rgba(10, 14, 23, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 245, 212, 0.15);
  border-radius: 12px;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-label {
  font-size: 12px;
  color: #94a3b8;
  min-width: 56px;
  font-family: 'JetBrains Mono', monospace;
}

.control-slider {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  outline: none;
}

.control-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #00f5d4;
  cursor: pointer;
  box-shadow: 0 0 8px rgba(0, 245, 212, 0.5);
  transition: transform 0.2s, box-shadow 0.2s;
}

.control-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 16px rgba(0, 245, 212, 0.8);
}

.control-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #00f5d4;
  cursor: pointer;
  border: none;
  box-shadow: 0 0 8px rgba(0, 245, 212, 0.5);
}

.control-toggles {
  display: flex;
  gap: 8px;
}

.toggle-btn {
  padding: 4px 12px;
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover {
  border-color: rgba(0, 245, 212, 0.3);
  color: #e2e8f0;
}

.toggle-btn.active {
  background: rgba(0, 245, 212, 0.15);
  border-color: rgba(0, 245, 212, 0.4);
  color: #00f5d4;
}
</style>
