import { ref, computed, type Ref } from 'vue'
import type { LissajousParams, WaveformOptions } from '@/types'
import { degToRad } from '@/utils/lissajousMath'

export function useWaveform(
  params: Ref<LissajousParams>,
  currentTime: Ref<number>
) {
  const waveformOptions = ref<WaveformOptions>({
    show: true,
    width: 400,
    height: 120
  })

  const generateWaveformData = (
    axis: 'x' | 'y',
    duration: number = 2,
    numPoints: number = 500
  ): { t: number; value: number }[] => {
    const { fx, fy, phase, amplitude } = params.value
    const phaseRad = degToRad(phase)
    const data: { t: number; value: number }[] = []

    for (let i = 0; i < numPoints; i++) {
      const t = (i / (numPoints - 1)) * duration
      let value: number
      if (axis === 'x') {
        value = amplitude * Math.sin(2 * Math.PI * fx * t + phaseRad)
      } else {
        value = amplitude * Math.sin(2 * Math.PI * fy * t)
      }
      data.push({ t, value })
    }

    return data
  }

  const getWaveformValueAtTime = (axis: 'x' | 'y', time: number): number => {
    const { fx, fy, phase, amplitude } = params.value
    const phaseRad = degToRad(phase)
    if (axis === 'x') {
      return amplitude * Math.sin(2 * Math.PI * fx * time + phaseRad)
    } else {
      return amplitude * Math.sin(2 * Math.PI * fy * time)
    }
  }

  const xWaveformData = computed(() => {
    const duration = 2
    const numPoints = 500
    const { fx, phase, amplitude } = params.value
    const phaseRad = degToRad(phase)
    const endTime = currentTime.value
    const startTime = endTime - duration
    const data: { t: number; value: number }[] = []

    for (let i = 0; i < numPoints; i++) {
      const t = startTime + (i / (numPoints - 1)) * duration
      const value = amplitude * Math.sin(2 * Math.PI * fx * t + phaseRad)
      data.push({ t, value })
    }

    return data
  })

  const yWaveformData = computed(() => {
    const duration = 2
    const numPoints = 500
    const { fy, amplitude } = params.value
    const endTime = currentTime.value
    const startTime = endTime - duration
    const data: { t: number; value: number }[] = []

    for (let i = 0; i < numPoints; i++) {
      const t = startTime + (i / (numPoints - 1)) * duration
      const value = amplitude * Math.sin(2 * Math.PI * fy * t)
      data.push({ t, value })
    }

    return data
  })

  return {
    waveformOptions,
    generateWaveformData,
    getWaveformValueAtTime,
    xWaveformData,
    yWaveformData
  }
}
