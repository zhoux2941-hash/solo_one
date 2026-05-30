import { useRef, useEffect, useCallback } from 'react'
import type { RhythmType, ECGDataPoint, FeaturePoint } from '@/types/ecg'
import { RHYTHM_PRESETS } from '@/types/ecg'
import { generateRealtimeSample, SAMPLE_RATE } from '@/utils/ecgSynthesis'

interface UseECGAnimationOptions {
  canvasRef: React.RefObject<HTMLCanvasElement>
  rhythmType: RhythmType
  isPlaying: boolean
  speed: number
  externalData: ECGDataPoint[] | null
  onTimeUpdate: (time: number) => void
  onStatsUpdate: (bpm: number, isRegular: boolean) => void
  onWaveformUpdate: (data: ECGDataPoint[]) => void
  onFeaturesUpdate: (features: FeaturePoint[]) => void
}

export function useECGAnimation({
  canvasRef,
  rhythmType,
  isPlaying,
  speed,
  externalData,
  onTimeUpdate,
  onStatsUpdate,
  onWaveformUpdate,
  onFeaturesUpdate,
}: UseECGAnimationOptions) {
  const animationRef = useRef<number>()
  const timeRef = useRef(0)
  const bufferRef = useRef<ECGDataPoint[]>([])
  const lastRRTimeRef = useRef(0)
  const rrIntervalsRef = useRef<number[]>([])
  const extIndexRef = useRef(0)
  const peakDetectionBuffer = useRef<{ voltage: number; time: number; slope: number }[]>([])
  const refractoryPeriodRef = useRef(0)

  const drawECG = useCallback(
    (ctx: CanvasRenderingContext2D, data: ECGDataPoint[], width: number, height: number) => {
      const preset = RHYTHM_PRESETS[rhythmType]

      ctx.fillStyle = '#0a0e17'
      ctx.fillRect(0, 0, width, height)

      ctx.strokeStyle = 'rgba(0, 255, 136, 0.08)'
      ctx.lineWidth = 1

      const gridSizeX = width / 10
      const gridSizeY = height / 8

      for (let x = 0; x <= width; x += gridSizeX) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }

      for (let y = 0; y <= height; y += gridSizeY) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      if (data.length < 2) return

      const centerY = height / 2
      const voltageScale = height * 0.35

      ctx.strokeStyle = preset.color
      ctx.lineWidth = 2
      ctx.shadowColor = preset.color
      ctx.shadowBlur = 8

      ctx.beginPath()

      for (let i = 0; i < data.length; i++) {
        const point = data[i]
        const x = (point.time - timeRef.current + 10) * (width / 10)
        const y = centerY - point.voltage * voltageScale

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      ctx.stroke()
      ctx.shadowBlur = 0
    },
    [rhythmType],
  )

  const detectRRPeak = useCallback(
    (voltage: number, time: number) => {
      const preset = RHYTHM_PRESETS[rhythmType]
      const bufferSize = 25

      let slope = 0
      if (peakDetectionBuffer.current.length > 0) {
        const prev = peakDetectionBuffer.current[peakDetectionBuffer.current.length - 1]
        slope = (voltage - prev.voltage) / (time - prev.time)
      }

      peakDetectionBuffer.current.push({ voltage, time, slope })
      if (peakDetectionBuffer.current.length > bufferSize) {
        peakDetectionBuffer.current.shift()
      }

      if (time < refractoryPeriodRef.current) {
        return
      }

      const baseRR = 60 / preset.heartRate
      const minRRInterval = rhythmType === 'atrial_fibrillation' ? baseRR * 0.4 : baseRR * 0.5

      if (time - lastRRTimeRef.current < minRRInterval) {
        return
      }

      const buf = peakDetectionBuffer.current
      if (buf.length < 15) return

      const midIdx = Math.floor(buf.length / 2)
      const current = buf[midIdx]

      const leftWindow = buf.slice(0, midIdx)
      const rightWindow = buf.slice(midIdx + 1)

      const isLocalMax =
        current.voltage > 0.4 &&
        leftWindow.every((p) => p.voltage <= current.voltage * 1.02) &&
        rightWindow.every((p) => p.voltage <= current.voltage * 1.02)

      if (!isLocalMax) return

      const maxSlope = Math.max(...leftWindow.map((p) => p.slope))
      const steepRise = maxSlope > 15

      const peakHeight = current.voltage - Math.min(...leftWindow.map((p) => p.voltage))
      const significantPeak = peakHeight > 0.35

      const avgBefore = leftWindow.slice(-5).reduce((a, b) => a + b.voltage, 0) / 5
      const avgAfter = rightWindow.slice(0, 5).reduce((a, b) => a + b.voltage, 0) / 5
      const sharpPeak = current.voltage > avgBefore * 1.4 && current.voltage > avgAfter * 1.4

      if (steepRise && significantPeak && sharpPeak) {
        const interval = time - lastRRTimeRef.current
        refractoryPeriodRef.current = time + minRRInterval * 0.8

        if (lastRRTimeRef.current > 0) {
          rrIntervalsRef.current.push(interval * 1000)
          if (rrIntervalsRef.current.length > 10) {
            rrIntervalsRef.current.shift()
          }

          const avgRR = rrIntervalsRef.current.reduce((a, b) => a + b, 0) / rrIntervalsRef.current.length
          const bpm = Math.round(60000 / avgRR)

          let isRegular = preset.isRegular
          if (rrIntervalsRef.current.length > 3) {
            const mean = avgRR
            const variance =
              rrIntervalsRef.current.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
              rrIntervalsRef.current.length
            const stdDev = Math.sqrt(variance)
            const cv = (stdDev / mean) * 100
            isRegular = cv < 15
          }

          onStatsUpdate(bpm, isRegular)
        }
        lastRRTimeRef.current = time
      }
    },
    [rhythmType, onStatsUpdate],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const animate = () => {
      const { width, height } = canvas

      if (isPlaying) {
        const dt = speed / 60

        if (externalData && externalData.length > 0) {
          const samplesToAdd = Math.ceil(SAMPLE_RATE * dt)
          for (let i = 0; i < samplesToAdd; i++) {
            const idx = extIndexRef.current % externalData.length
            const basePoint = externalData[idx]
            const prevPoint = externalData[(idx - 1 + externalData.length) % externalData.length]

            const interpTime = timeRef.current
            const interpVoltage = prevPoint.voltage + (basePoint.voltage - prevPoint.voltage) * (i / samplesToAdd)

            bufferRef.current.push({ time: interpTime, voltage: interpVoltage })
            extIndexRef.current++
            timeRef.current += 1 / SAMPLE_RATE
          }
        } else {
          const samplesToAdd = Math.ceil(SAMPLE_RATE * dt)
          for (let i = 0; i < samplesToAdd; i++) {
            const voltage = generateRealtimeSample(rhythmType, timeRef.current)
            bufferRef.current.push({ time: timeRef.current, voltage })
            detectRRPeak(voltage, timeRef.current)
            timeRef.current += 1 / SAMPLE_RATE
          }
        }

        const cutoffTime = timeRef.current - 12
        bufferRef.current = bufferRef.current.filter((p) => p.time >= cutoffTime)

        onTimeUpdate(timeRef.current)
        onWaveformUpdate([...bufferRef.current])
      }

      drawECG(ctx, bufferRef.current, width, height)
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [
    canvasRef,
    rhythmType,
    isPlaying,
    speed,
    externalData,
    drawECG,
    detectRRPeak,
    onTimeUpdate,
    onWaveformUpdate,
    onFeaturesUpdate,
  ])

  useEffect(() => {
    bufferRef.current = []
    timeRef.current = 0
    extIndexRef.current = 0
    lastRRTimeRef.current = 0
    rrIntervalsRef.current = []
    peakDetectionBuffer.current = []
    refractoryPeriodRef.current = 0
  }, [rhythmType, externalData])

  const getVoltageAtTime = useCallback(
    (screenX: number, width: number): { time: number; voltage: number } | null => {
      const viewDuration = 10
      const relX = screenX / width
      const targetTime = timeRef.current - viewDuration + relX * viewDuration

      let nearestPoint: ECGDataPoint | null = null
      let minDist = Infinity

      for (const point of bufferRef.current) {
        const dist = Math.abs(point.time - targetTime)
        if (dist < minDist) {
          minDist = dist
          nearestPoint = point
        }
      }

      if (nearestPoint && minDist < 0.05) {
        return { time: nearestPoint.time, voltage: nearestPoint.voltage }
      }

      return null
    },
    [],
  )

  return { getVoltageAtTime }
}
