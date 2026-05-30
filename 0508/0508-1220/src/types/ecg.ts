export type RhythmType = 'normal' | 'tachycardia' | 'bradycardia' | 'atrial_fibrillation'

export interface ECGConfig {
  rhythmType: RhythmType
  heartRate: number
  isPlaying: boolean
  speed: number
  showFeaturePoints: boolean
}

export interface FeaturePoint {
  type: 'P' | 'QRS' | 'T'
  timeOffset: number
  amplitude: number
  duration: number
}

export interface WaveformParameters {
  prInterval: number
  qrsDuration: number
  qtInterval: number
  rrInterval: number
}

export interface ECGDataPoint {
  time: number
  voltage: number
}

export interface RhythmStats {
  bpm: number
  isRegular: boolean
  rrIntervals: number[]
}

export type ArrhythmiaType =
  | 'bradycardia'
  | 'tachycardia'
  | 'irregular_rhythm'
  | 'premature_beat'
  | 'missed_beat'
  | 'atrial_fibrillation'

export interface ArrhythmiaAlert {
  id: string
  type: ArrhythmiaType
  startTime: number
  endTime: number
  severity: 'warning' | 'critical'
  message: string
}

export const ARRHYTHMIA_LABELS: Record<ArrhythmiaType, { label: string; color: string; icon: string }> = {
  bradycardia: { label: '心动过缓', color: '#4ecdc4', icon: '🐢' },
  tachycardia: { label: '心动过速', color: '#ff6b35', icon: '⚡' },
  irregular_rhythm: { label: '心律不齐', color: '#fbbf24', icon: '〰️' },
  premature_beat: { label: '早搏', color: '#a78bfa', icon: '💥' },
  missed_beat: { label: '漏搏', color: '#ff4757', icon: '⏸️' },
  atrial_fibrillation: { label: '房颤', color: '#ff4757', icon: '🫀' },
}

export interface RhythmPreset {
  label: string
  labelEn: string
  heartRate: number
  prInterval: number
  qrsDuration: number
  qtInterval: number
  hasPWave: boolean
  isRegular: boolean
  color: string
}

export const RHYTHM_PRESETS: Record<RhythmType, RhythmPreset> = {
  normal: {
    label: '正常窦性心律',
    labelEn: 'Normal Sinus Rhythm',
    heartRate: 72,
    prInterval: 160,
    qrsDuration: 80,
    qtInterval: 380,
    hasPWave: true,
    isRegular: true,
    color: '#00ff88',
  },
  tachycardia: {
    label: '窦性心动过速',
    labelEn: 'Sinus Tachycardia',
    heartRate: 120,
    prInterval: 140,
    qrsDuration: 80,
    qtInterval: 320,
    hasPWave: true,
    isRegular: true,
    color: '#ff6b35',
  },
  bradycardia: {
    label: '窦性心动过缓',
    labelEn: 'Sinus Bradycardia',
    heartRate: 45,
    prInterval: 180,
    qrsDuration: 80,
    qtInterval: 440,
    hasPWave: true,
    isRegular: true,
    color: '#4ecdc4',
  },
  atrial_fibrillation: {
    label: '房颤',
    labelEn: 'Atrial Fibrillation',
    heartRate: 95,
    prInterval: 0,
    qrsDuration: 80,
    qtInterval: 360,
    hasPWave: false,
    isRegular: false,
    color: '#ff4757',
  },
}
