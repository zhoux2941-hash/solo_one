import type { FeaturePoint, RhythmType } from '@/types/ecg'
import { RHYTHM_PRESETS } from '@/types/ecg'

export function detectFeaturePoints(
  rhythmType: RhythmType,
  beatStartTime: number,
  rrInterval: number,
): FeaturePoint[] {
  const preset = RHYTHM_PRESETS[rhythmType]
  const features: FeaturePoint[] = []

  if (preset.hasPWave) {
    features.push({
      type: 'P',
      timeOffset: beatStartTime + (preset.prInterval * 0.4) / 1000,
      amplitude: 0.15,
      duration: 0.09,
    })
  }

  const qrsStartTime = beatStartTime + preset.prInterval / 1000
  features.push({
    type: 'QRS',
    timeOffset: qrsStartTime + (preset.qrsDuration * 0.35) / 1000,
    amplitude: 1.0,
    duration: preset.qrsDuration / 1000,
  })

  features.push({
    type: 'T',
    timeOffset: beatStartTime + (preset.qtInterval - preset.qrsDuration * 0.3) / 1000,
    amplitude: 0.3,
    duration: 0.16,
  })

  return features
}

export function findNearestFeature(
  time: number,
  features: FeaturePoint[],
): FeaturePoint | null {
  let nearest: FeaturePoint | null = null
  let minDist = Infinity

  for (const f of features) {
    const dist = Math.abs(time - f.timeOffset)
    if (dist < minDist && dist < 0.15) {
      minDist = dist
      nearest = f
    }
  }

  return nearest
}
