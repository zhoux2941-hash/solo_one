import { ref, type Ref } from 'vue'
import type { Point, DrawingOptions, TracerOptions } from '@/types'
import * as canvasUtils from '@/utils/canvasUtils'

export function useCanvasRenderer(canvasRef: Ref<HTMLCanvasElement | null>) {
  const width = ref(0)
  const height = ref(0)

  function init(w: number, h: number): void {
    width.value = w
    height.value = h
    const canvas = canvasRef.value
    if (canvas) {
      canvasUtils.resizeCanvas(canvas, w, h)
    }
  }

  function mapToCanvas(point: Point): { x: number; y: number } {
    const centerX = width.value / 2
    const centerY = height.value / 2
    const scale = Math.min(width.value, height.value) / 2 - 20
    return {
      x: centerX + point.x * scale,
      y: centerY - point.y * scale
    }
  }

  function drawLissajous(points: Point[], options: DrawingOptions, color: string = '#00f5d4'): void {
    const canvas = canvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvasUtils.clearCanvas(ctx, width.value, height.value, '#0a0e17')

    if (options.showGrid) {
      canvasUtils.drawGrid(ctx, width.value, height.value)
    }
    if (options.showAxes) {
      canvasUtils.drawAxes(ctx, width.value, height.value)
    }

    if (points.length === 0) return

    ctx.strokeStyle = color
    ctx.lineWidth = options.lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (options.glowEffect) {
      canvasUtils.setGlow(ctx, color)
    }

    ctx.beginPath()
    const firstMapped = mapToCanvas(points[0])
    ctx.moveTo(firstMapped.x, firstMapped.y)
    for (let i = 1; i < points.length; i++) {
      const mapped = mapToCanvas(points[i])
      ctx.lineTo(mapped.x, mapped.y)
    }
    ctx.stroke()

    if (options.glowEffect) {
      canvasUtils.clearGlow(ctx)
    }
  }

  function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3)
  }

  function easeInQuad(t: number): number {
    return t * t
  }

  function drawTracer(point: Point, trailPoints: Point[], options: TracerOptions, color: string = '#ff006e'): void {
    if (!options.enabled) return
    const canvas = canvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const mappedCurrent = mapToCanvas(point)

    if (trailPoints.length > 3) {
      ctx.save()
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      const startIdx = Math.max(0, trailPoints.length - options.trailLength)
      const visibleTrail = trailPoints.slice(startIdx)
      const segmentCount = Math.min(visibleTrail.length - 1, 50)

      for (let seg = 0; seg < segmentCount; seg++) {
        const t1 = seg / segmentCount
        const t2 = (seg + 1) / segmentCount

        const idx1 = Math.floor(t1 * (visibleTrail.length - 1))
        const idx2 = Math.floor(t2 * (visibleTrail.length - 1))

        const p1 = mapToCanvas(visibleTrail[idx1])
        const p2 = mapToCanvas(visibleTrail[idx2])

        const alpha = easeOutCubic(t2)
        const lineWidth = options.pointSize * alpha * 0.7
        const glowSize = 20 * alpha

        canvasUtils.setGlow(ctx, color, glowSize)
        ctx.strokeStyle = `rgba(255, 0, 110, ${alpha})`
        ctx.lineWidth = lineWidth

        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.stroke()
      }

      canvasUtils.clearGlow(ctx)
      ctx.restore()
    }

    ctx.save()

    const gradient = ctx.createRadialGradient(
      mappedCurrent.x, mappedCurrent.y, 0,
      mappedCurrent.x, mappedCurrent.y, options.pointSize * 3
    )
    gradient.addColorStop(0, 'rgba(255, 0, 110, 0.8)')
    gradient.addColorStop(0.3, 'rgba(255, 0, 110, 0.4)')
    gradient.addColorStop(1, 'rgba(255, 0, 110, 0)')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(mappedCurrent.x, mappedCurrent.y, options.pointSize * 3, 0, Math.PI * 2)
    ctx.fill()

    canvasUtils.setGlow(ctx, color, 25)
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(mappedCurrent.x, mappedCurrent.y, options.pointSize, 0, Math.PI * 2)
    ctx.fill()
    canvasUtils.clearGlow(ctx)

    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(mappedCurrent.x, mappedCurrent.y, options.pointSize * 0.35, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  function drawWaveform(
    ctx: CanvasRenderingContext2D,
    data: { t: number; value: number }[],
    width: number,
    height: number,
    color: string,
    currentValue?: number
  ): void {
    if (data.length < 2) return

    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()

    const firstPoint = data[0]
    const startX = (firstPoint.t / (Math.PI * 2)) * width
    const startY = height / 2 - (firstPoint.value * height) / 2
    ctx.moveTo(startX, startY)

    for (let i = 1; i < data.length; i++) {
      const point = data[i]
      const x = (point.t / (Math.PI * 2)) * width
      const y = height / 2 - (point.value * height) / 2
      ctx.lineTo(x, y)
    }
    ctx.stroke()

    if (currentValue !== undefined) {
      const lastPoint = data[data.length - 1]
      const x = (lastPoint.t / (Math.PI * 2)) * width
      const y = height / 2 - (currentValue * height) / 2

      canvasUtils.setGlow(ctx, color, 10)
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.fill()
      canvasUtils.clearGlow(ctx)
    }
  }

  function exportPNG(filename: string = 'lissajous.png'): void {
    const canvas = canvasRef.value
    if (!canvas) return

    const link = document.createElement('a')
    link.download = filename
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return {
    width,
    height,
    init,
    drawLissajous,
    drawTracer,
    drawWaveform,
    exportPNG
  }
}
