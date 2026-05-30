import type { RhythmType, WaveformParameters, RhythmStats } from '@/types/ecg'
import { RHYTHM_PRESETS } from '@/types/ecg'

export function getWaveformParameters(rhythmType: RhythmType): WaveformParameters {
  const preset = RHYTHM_PRESETS[rhythmType]
  return {
    prInterval: preset.prInterval,
    qrsDuration: preset.qrsDuration,
    qtInterval: preset.qtInterval,
    rrInterval: Math.round(60000 / preset.heartRate),
  }
}

export function calculateRhythmStats(
  rrIntervals: number[],
  isRegular: boolean,
): RhythmStats {
  if (rrIntervals.length === 0) {
    return { bpm: 0, isRegular: true, rrIntervals: [] }
  }

  const avgRR = rrIntervals.reduce((a, b) => a + b, 0) / rrIntervals.length
  const bpm = Math.round(60000 / avgRR)

  let regular = isRegular
  if (rrIntervals.length > 2) {
    const mean = avgRR
    const variance = rrIntervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / rrIntervals.length
    const stdDev = Math.sqrt(variance)
    const cv = (stdDev / mean) * 100
    regular = cv < 15
  }

  return { bpm, isRegular: regular, rrIntervals }
}

export function formatTimeMs(ms: number): string {
  return `${ms.toFixed(0)} ms`
}

export function formatBpm(bpm: number): string {
  return `${bpm.toFixed(0)} BPM`
}
