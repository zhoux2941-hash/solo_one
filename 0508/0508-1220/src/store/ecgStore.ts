import { create } from 'zustand'
import type { RhythmType, ECGConfig, ECGDataPoint, FeaturePoint, RhythmStats } from '@/types/ecg'
import { RHYTHM_PRESETS } from '@/types/ecg'

interface ECGState {
  config: ECGConfig
  externalData: ECGDataPoint[] | null
  isExternalMode: boolean
  stats: RhythmStats
  waveformData: ECGDataPoint[]
  featurePoints: FeaturePoint[]
  currentTime: number
  playbackSpeed: number
  showTooltip: boolean
  tooltipPosition: { x: number; y: number } | null
  tooltipData: {
    time: number
    voltage: number
    prInterval: number
    qrsDuration: number
    qtInterval: number
  } | null
}

interface ECGActions {
  setRhythmType: (type: RhythmType) => void
  togglePlaying: () => void
  setPlaying: (isPlaying: boolean) => void
  setSpeed: (speed: number) => void
  toggleFeaturePoints: () => void
  setExternalData: (data: ECGDataPoint[] | null) => void
  exitExternalMode: () => void
  updateCurrentTime: (time: number) => void
  setStats: (stats: RhythmStats) => void
  setWaveformData: (data: ECGDataPoint[]) => void
  setFeaturePoints: (points: FeaturePoint[]) => void
  showParametersTooltip: (
    position: { x: number; y: number } | null,
    data: { time: number; voltage: number; prInterval: number; qrsDuration: number; qtInterval: number } | null,
  ) => void
  hideTooltip: () => void
}

export const useECGStore = create<ECGState & ECGActions>((set) => ({
  config: {
    rhythmType: 'normal',
    heartRate: RHYTHM_PRESETS.normal.heartRate,
    isPlaying: true,
    speed: 1,
    showFeaturePoints: true,
  },
  externalData: null,
  isExternalMode: false,
  stats: {
    bpm: RHYTHM_PRESETS.normal.heartRate,
    isRegular: true,
    rrIntervals: [],
  },
  waveformData: [],
  featurePoints: [],
  currentTime: 0,
  playbackSpeed: 1,
  showTooltip: false,
  tooltipPosition: null,
  tooltipData: null,

  setRhythmType: (type: RhythmType) =>
    set((state) => ({
      config: {
        ...state.config,
        rhythmType: type,
        heartRate: RHYTHM_PRESETS[type].heartRate,
      },
      stats: {
        bpm: RHYTHM_PRESETS[type].heartRate,
        isRegular: RHYTHM_PRESETS[type].isRegular,
        rrIntervals: [],
      },
    })),

  togglePlaying: () =>
    set((state) => ({
      config: {
        ...state.config,
        isPlaying: !state.config.isPlaying,
      },
    })),

  setPlaying: (isPlaying: boolean) =>
    set((state) => ({
      config: {
        ...state.config,
        isPlaying,
      },
    })),

  setSpeed: (speed: number) =>
    set((state) => ({
      config: {
        ...state.config,
        speed: Math.max(0.25, Math.min(4, speed)),
      },
      playbackSpeed: speed,
    })),

  toggleFeaturePoints: () =>
    set((state) => ({
      config: {
        ...state.config,
        showFeaturePoints: !state.config.showFeaturePoints,
      },
    })),

  setExternalData: (data: ECGDataPoint[] | null) =>
    set({
      externalData: data,
      isExternalMode: data !== null,
      currentTime: 0,
      config: data
        ? {
            rhythmType: 'normal',
            heartRate: 60,
            isPlaying: true,
            speed: 1,
            showFeaturePoints: true,
          }
        : undefined,
    }),

  exitExternalMode: () =>
    set({
      externalData: null,
      isExternalMode: false,
      currentTime: 0,
    }),

  updateCurrentTime: (time: number) => set({ currentTime: time }),

  setStats: (stats: RhythmStats) => set({ stats }),

  setWaveformData: (data: ECGDataPoint[]) => set({ waveformData: data }),

  setFeaturePoints: (points: FeaturePoint[]) => set({ featurePoints: points }),

  showParametersTooltip: (position, data) =>
    set({
      tooltipPosition: position,
      tooltipData: data,
      showTooltip: position !== null && data !== null,
    }),

  hideTooltip: () =>
    set({
      tooltipPosition: null,
      tooltipData: null,
      showTooltip: false,
    }),
}))
