import { useRef, useCallback } from 'react'
import { useECGStore } from '@/store/ecgStore'
import { useECGAnimation } from '@/hooks/useECGAnimation'
import { getWaveformParameters } from '@/utils/parameterCalculator'

export default function ECGCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    config,
    externalData,
    updateCurrentTime,
    setStats,
    setWaveformData,
    setFeaturePoints,
    showParametersTooltip,
    hideTooltip,
  } = useECGStore()

  const handleTimeUpdate = useCallback(
    (time: number) => {
      updateCurrentTime(time)
    },
    [updateCurrentTime],
  )

  const handleStatsUpdate = useCallback(
    (bpm: number, isRegular: boolean) => {
      setStats({ bpm, isRegular, rrIntervals: [] })
    },
    [setStats],
  )

  const handleWaveformUpdate = useCallback(
    (data: any[]) => {
      setWaveformData(data)
    },
    [setWaveformData],
  )

  const handleFeaturesUpdate = useCallback(
    (features: any[]) => {
      setFeaturePoints(features)
    },
    [setFeaturePoints],
  )

  const { getVoltageAtTime } = useECGAnimation({
    canvasRef,
    rhythmType: config.rhythmType,
    isPlaying: config.isPlaying,
    speed: config.speed,
    externalData,
    onTimeUpdate: handleTimeUpdate,
    onStatsUpdate: handleStatsUpdate,
    onWaveformUpdate: handleWaveformUpdate,
    onFeaturesUpdate: handleFeaturesUpdate,
  })

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const result = getVoltageAtTime(x, canvas.width)
      const params = getWaveformParameters(config.rhythmType)

      if (result) {
        showParametersTooltip(
          { x: e.clientX, y: e.clientY },
          {
            time: result.time,
            voltage: result.voltage,
            prInterval: params.prInterval,
            qrsDuration: params.qrsDuration,
            qtInterval: params.qtInterval,
          },
        )
      } else {
        hideTooltip()
      }
    },
    [getVoltageAtTime, config.rhythmType, showParametersTooltip, hideTooltip],
  )

  const handleMouseLeave = useCallback(() => {
    hideTooltip()
  }, [hideTooltip])

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        width={1200}
        height={500}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  )
}
