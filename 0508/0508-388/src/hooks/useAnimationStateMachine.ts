import { useEffect, useRef } from 'react'
import type { AnimationStateMachine, AnimationState, StrikeAction } from '../../shared/types'
import { animationStateTransitions } from '../../shared/types'

export const STATE_DURATIONS: Record<AnimationState, number> = {
  IDLE: 0,
  WINDUP: 0.3,
  STRIKE: 0.1,
  RECOVER: 0.25,
}

export function createInitialState(): AnimationStateMachine {
  return {
    state: 'IDLE',
    type: 'none',
    totalStrikes: 0,
    currentStrike: 0,
    progress: 0,
    isActive: false,
  }
}

export function animationReducer(
  state: AnimationStateMachine,
  action: StrikeAction
): AnimationStateMachine {
  switch (action.type) {
    case 'TRIGGER': {
      if (state.isActive) return state
      return {
        ...state,
        state: 'WINDUP',
        type: action.instrument,
        totalStrikes: action.count,
        currentStrike: 1,
        progress: 0,
        isActive: true,
      }
    }

    case 'NEXT_STATE': {
      if (!state.isActive) return state

      const nextStates = animationStateTransitions[state.state]
      let nextState: AnimationState

      if (state.state === 'RECOVER') {
        if (state.currentStrike < state.totalStrikes) {
          nextState = 'WINDUP'
          return {
            ...state,
            state: nextState,
            currentStrike: state.currentStrike + 1,
            progress: 0,
          }
        } else {
          nextState = 'IDLE'
          return {
            ...state,
            state: nextState,
            type: 'none',
            totalStrikes: 0,
            currentStrike: 0,
            progress: 0,
            isActive: false,
          }
        }
      } else {
        nextState = nextStates[0]
        return {
          ...state,
          state: nextState,
          progress: 0,
        }
      }
    }

    case 'RESET': {
      return createInitialState()
    }

    default:
      return state
  }
}

export function useAnimationStateMachine(
  animationState: AnimationStateMachine,
  dispatch: (action: StrikeAction) => void,
  onStrikeImpact?: () => void
) {
  const elapsedRef = useRef(0)

  useEffect(() => {
    elapsedRef.current = 0
  }, [animationState.state])

  useEffect(() => {
    if (!animationState.isActive) return
    if (animationState.state === 'IDLE') return

    const duration = STATE_DURATIONS[animationState.state]
    if (duration <= 0) return

    const interval = setInterval(() => {
      elapsedRef.current += 0.016
      const newProgress = Math.min(1, elapsedRef.current / duration)

      if (animationState.state === 'STRIKE' && newProgress >= 0.5 && elapsedRef.current - 0.016 < duration * 0.5) {
        onStrikeImpact?.()
      }

      if (newProgress >= 1) {
        dispatch({ type: 'NEXT_STATE' })
      }
    }, 16)

    return () => clearInterval(interval)
  }, [animationState.state, animationState.isActive, dispatch, onStrikeImpact])
}

export function getStrikeAngle(
  state: AnimationState,
  progress: number,
  maxAngle: number = 0.6
): number {
  switch (state) {
    case 'IDLE':
      return 0
    case 'WINDUP':
      return -maxAngle * easeOutQuad(progress)
    case 'STRIKE':
      const strikeProgress = easeInQuad(progress)
      return -maxAngle * (1 - strikeProgress) + maxAngle * 0.15 * strikeProgress
    case 'RECOVER':
      return maxAngle * 0.15 * (1 - easeOutQuad(progress))
    default:
      return 0
  }
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

function easeInQuad(t: number): number {
  return t * t
}
