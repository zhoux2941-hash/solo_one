import type { RhythmType, ECGDataPoint, FeaturePoint, RhythmPreset } from '@/types/ecg'
import { RHYTHM_PRESETS } from '@/types/ecg'

const SAMPLE_RATE = 500

function gaussian(x: number, mean: number, sigma: number, amplitude: number): number {
  const exp = -0.5 * Math.pow((x - mean) / sigma, 2)
  return amplitude * Math.exp(exp)
}

function generateSingleBeat(
  beatStartTime: number,
  preset: RhythmPreset,
  rrInterval: number,
): { points: ECGDataPoint[]; features: FeaturePoint[] } {
  const points: ECGDataPoint[] = []
  const features: FeaturePoint[] = []
  const dt = 1 / SAMPLE_RATE
  const rrMs = rrInterval

  const pWaveCenter = beatStartTime + preset.prInterval * 0.4 / 1000
  const qrsStart = beatStartTime + preset.prInterval / 1000
  const rPeakTime = qrsStart + preset.qrsDuration * 0.35 / 1000
  const sWaveTime = qrsStart + preset.qrsDuration * 0.7 / 1000
  const tWaveCenter = qrsStart + (preset.qtInterval - preset.qrsDuration * 0.3) / 1000

  const beatDuration = rrMs / 1000
  const numSamples = Math.floor(beatDuration * SAMPLE_RATE)

  for (let i = 0; i < numSamples; i++) {
    const t = beatStartTime + i * dt
    let voltage = 0

    if (preset.hasPWave) {
      voltage += gaussian(t, pWaveCenter, 0.018, 0.15)
    }

    voltage += gaussian(t, rPeakTime - 0.008, 0.004, -0.1)
    voltage += gaussian(t, rPeakTime, 0.006, 1.0)
    voltage += gaussian(t, sWaveTime, 0.005, -0.2)

    voltage += gaussian(t, tWaveCenter, 0.028, 0.3)

    voltage += 0.01 * Math.sin(2 * Math.PI * 0.2 * t)

    if (!preset.isRegular && !preset.hasPWave) {
      voltage += 0.03 * Math.sin(2 * Math.PI * 7.5 * t + Math.random() * 0.5)
      voltage += 0.02 * Math.sin(2 * Math.PI * 11.3 * t + Math.random() * 0.3)
      voltage += 0.015 * Math.sin(2 * Math.PI * 15.7 * t)
    }

    voltage += (Math.random() - 0.5) * 0.005

    points.push({ time: t, voltage })
  }

  if (preset.hasPWave) {
    features.push({
      type: 'P',
      timeOffset: pWaveCenter - beatStartTime,
      amplitude: 0.15,
      duration: 0.09,
    })
  }

  features.push({
    type: 'QRS',
    timeOffset: rPeakTime - beatStartTime,
    amplitude: 1.0,
    duration: preset.qrsDuration / 1000,
  })

  features.push({
    type: 'T',
    timeOffset: tWaveCenter - beatStartTime,
    amplitude: 0.3,
    duration: 0.16,
  })

  return { points, features }
}

export function generateECGSignal(
  rhythmType: RhythmType,
  durationSeconds: number,
  seed?: number,
): { data: ECGDataPoint[]; features: FeaturePoint[] } {
  const preset = RHYTHM_PRESETS[rhythmType]
  const allPoints: ECGDataPoint[] = []
  const allFeatures: FeaturePoint[] = []

  let currentTime = 0
  let beatIndex = 0

  while (currentTime < durationSeconds) {
    let rrInterval: number

    if (rhythmType === 'atrial_fibrillation') {
      const baseRR = 60 / preset.heartRate
      const variation = (Math.random() - 0.5) * baseRR * 0.5
      rrInterval = Math.max(0.4, Math.min(1.2, baseRR + variation)) * 1000
    } else {
      rrInterval = 60000 / preset.heartRate
    }

    const { points, features } = generateSingleBeat(currentTime, preset, rrInterval)

    const offsetFeatures = features.map((f) => ({
      ...f,
      timeOffset: currentTime + f.timeOffset,
    }))

    allPoints.push(...points)
    allFeatures.push(...offsetFeatures)

    currentTime += rrInterval / 1000
    beatIndex++
  }

  return { data: allPoints, features: allFeatures }
}

export function generateRealtimeSample(
  rhythmType: RhythmType,
  time: number,
): number {
  const preset = RHYTHM_PRESETS[rhythmType]
  const rrInterval = 60 / preset.heartRate
  const beatPhase = ((time % rrInterval) / rrInterval)

  let voltage = 0

  const pPhase = 0.08
  const qPhase = 0.16
  const rPhase = 0.2
  const sPhase = 0.24
  const tPhase = 0.4

  if (preset.hasPWave) {
    const pCenter = pPhase
    const pSigma = 0.03
    voltage += gaussian(beatPhase, pCenter, pSigma, 0.15)
  }

  voltage += gaussian(beatPhase, rPhase - 0.015, 0.008, -0.1)
  voltage += gaussian(beatPhase, rPhase, 0.01, 1.0)
  voltage += gaussian(beatPhase, sPhase, 0.008, -0.2)

  voltage += gaussian(beatPhase, tPhase, 0.05, 0.3)

  voltage += 0.01 * Math.sin(2 * Math.PI * 0.2 * time)

  if (!preset.isRegular && !preset.hasPWave) {
    voltage += 0.03 * Math.sin(2 * Math.PI * 7.5 * time)
    voltage += 0.02 * Math.sin(2 * Math.PI * 11.3 * time)
    voltage += 0.015 * Math.sin(2 * Math.PI * 15.7 * time)
  }

  voltage += (Math.random() - 0.5) * 0.003

  return voltage
}

export { SAMPLE_RATE }
