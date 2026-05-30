import { ref, computed } from 'vue'
import type { LissajousParams, DrawingOptions, TracerOptions, Preset, Point, FrequencyRatio } from '@/types'
import { generatePoints, calculatePoint } from '@/utils/lissajousMath'
import { simplifyRatio } from '@/utils/gcd'

export function useLissajous() {
  const params = ref<LissajousParams>({
    fx: 3,
    fy: 2,
    phase: 90,
    amplitude: 0.8,
  })

  const drawingOptions = ref<DrawingOptions>({
    showGrid: true,
    showAxes: true,
    lineWidth: 2,
    glowEffect: true,
  })

  const tracerOptions = ref<TracerOptions>({
    enabled: false,
    trailLength: 100,
    pointSize: 6,
  })

  const currentTime = ref(0)
  const isPlaying = ref(false)
  const animationSpeed = ref(0.5)

  const frequencyRatio = computed<FrequencyRatio>(() => {
    return simplifyRatio(params.value.fx, params.value.fy)
  })

  const points = computed<Point[]>(() => {
    return generatePoints(params.value)
  })

  function setParams(partial: Partial<LissajousParams>) {
    params.value = { ...params.value, ...partial }
  }

  function setDrawingOptions(partial: Partial<DrawingOptions>) {
    drawingOptions.value = { ...drawingOptions.value, ...partial }
  }

  function setTracerOptions(partial: Partial<TracerOptions>) {
    tracerOptions.value = { ...tracerOptions.value, ...partial }
  }

  function togglePlay() {
    isPlaying.value = !isPlaying.value
  }

  function resetTime() {
    currentTime.value = 0
  }

  function applyPreset(preset: Preset) {
    const startParams = { ...params.value }
    const endParams = { ...preset.params }
    const duration = 500
    const startTime = performance.now()

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeProgress = 1 - Math.pow(1 - progress, 3)

      params.value = {
        fx: startParams.fx + (endParams.fx - startParams.fx) * easeProgress,
        fy: startParams.fy + (endParams.fy - startParams.fy) * easeProgress,
        phase: startParams.phase + (endParams.phase - startParams.phase) * easeProgress,
        amplitude: startParams.amplitude + (endParams.amplitude - startParams.amplitude) * easeProgress,
      }

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }

  function getCurrentPoint(): Point {
    return calculatePoint(currentTime.value, params.value)
  }

  return {
    params,
    drawingOptions,
    tracerOptions,
    currentTime,
    isPlaying,
    animationSpeed,
    frequencyRatio,
    points,
    setParams,
    setDrawingOptions,
    setTracerOptions,
    togglePlay,
    resetTime,
    applyPreset,
    getCurrentPoint,
  }
}
