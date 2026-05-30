import { create } from 'zustand'
import type { City, TimekeepingRule, LogEntry, AnimationStateMachine, StrikeAction } from '../../shared/types'
import { createInitialState, animationReducer, STATE_DURATIONS } from './useAnimationStateMachine'

interface DrumTowerState {
  cities: City[]
  selectedCity: City | null
  rules: TimekeepingRule[]
  logs: LogEntry[]
  currentShichenIndex: number
  isAutoPlaying: boolean
  animation: AnimationStateMachine
  _animationElapsed: number

  setCities: (cities: City[]) => void
  selectCity: (city: City) => void
  setRules: (rules: TimekeepingRule[]) => void
  setLogs: (logs: LogEntry[]) => void
  addLog: (log: LogEntry) => void
  setShichenIndex: (index: number) => void
  setAutoPlaying: (playing: boolean) => void
  dispatchAnimation: (action: StrikeAction) => void
  updateAnimationProgress: (delta: number) => { shouldTriggerImpact: boolean }
}

export const useDrumTowerStore = create<DrumTowerState>((set, get) => ({
  cities: [],
  selectedCity: null,
  rules: [],
  logs: [],
  currentShichenIndex: 3,
  isAutoPlaying: false,
  animation: createInitialState(),
  _animationElapsed: 0,

  setCities: (cities) => set({ cities }),
  selectCity: (city) => set({ selectedCity: city }),
  setRules: (rules) => set({ rules }),
  setLogs: (logs) => set({ logs }),
  addLog: (log) => set((state) => ({ logs: [log, ...state.logs] })),
  setShichenIndex: (index) => set({ currentShichenIndex: index }),
  setAutoPlaying: (playing) => set({ isAutoPlaying: playing }),
  dispatchAnimation: (action) =>
    set((state) => ({
      animation: animationReducer(state.animation, action),
      _animationElapsed: 0,
    })),

  updateAnimationProgress: (delta: number) => {
    const state = get()
    if (!state.animation.isActive || state.animation.state === 'IDLE') {
      return { shouldTriggerImpact: false }
    }

    const duration = STATE_DURATIONS[state.animation.state]
    if (duration <= 0) return { shouldTriggerImpact: false }

    const newElapsed = state._animationElapsed + delta
    const newProgress = Math.min(1, newElapsed / duration)

    const prevProgress = state.animation.progress
    const shouldTriggerImpact =
      state.animation.state === 'STRIKE' &&
      prevProgress < 0.5 &&
      newProgress >= 0.5

    if (newProgress >= 1) {
      set({
        animation: animationReducer(state.animation, { type: 'NEXT_STATE' }),
        _animationElapsed: 0,
      })
    } else {
      set({
        animation: { ...state.animation, progress: newProgress },
        _animationElapsed: newElapsed,
      })
    }

    return { shouldTriggerImpact }
  },
}))
