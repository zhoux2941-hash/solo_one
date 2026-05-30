export interface City {
  id: number
  name: string
  dynasty: string
  latitude: number | null
  longitude: number | null
  description: string
}

export interface TimekeepingRule {
  id: number
  city_id: number
  shichen: string
  modern_time: string
  bell_count: number
  drum_count: number
  description: string
}

export interface LogEntry {
  id: number
  city_id: number
  city_name?: string
  shichen: string
  bell_count: number
  drum_count: number
  action: string
  timestamp: string
}

export const SHICHEN_NAMES = [
  '子时', '丑时', '寅时', '卯时', '辰时', '巳时',
  '午时', '未时', '申时', '酉时', '戌时', '亥时',
]

export const SHICHEN_INDEX: Record<string, number> = {
  '子时': 0, '丑时': 1, '寅时': 2, '卯时': 3,
  '辰时': 4, '巳时': 5, '午时': 6, '未时': 7,
  '申时': 8, '酉时': 9, '戌时': 10, '亥时': 11,
}

export type AnimationState = 'IDLE' | 'WINDUP' | 'STRIKE' | 'RECOVER'

export interface AnimationStateMachine {
  state: AnimationState
  type: 'bell' | 'drum' | 'none'
  totalStrikes: number
  currentStrike: number
  progress: number
  isActive: boolean
}

export type StrikeAction =
  | { type: 'TRIGGER'; instrument: 'bell' | 'drum'; count: number }
  | { type: 'NEXT_STATE' }
  | { type: 'RESET' }

export const animationStateTransitions: Record<AnimationState, AnimationState[]> = {
  IDLE: ['WINDUP'],
  WINDUP: ['STRIKE'],
  STRIKE: ['RECOVER'],
  RECOVER: ['WINDUP', 'IDLE'],
}
