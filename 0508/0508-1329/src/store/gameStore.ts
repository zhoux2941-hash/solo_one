import { create } from 'zustand'
import type { GameStatus, GameEngineState } from '@/utils/gameEngine'

export interface PlayerState {
  angle: number
  weight: number
  radius: number
  color: string
  label: string
  isPlayer: boolean
}

export const INITIAL_PLAYERS: PlayerState[] = [
  { angle: 0, weight: 70, radius: 0.75, color: '#E53935', label: '你', isPlayer: true },
  { angle: (2 * Math.PI) / 3, weight: 60, radius: 0.7, color: '#1E88E5', label: 'AI-1', isPlayer: false },
  { angle: (4 * Math.PI) / 3, weight: 65, radius: 0.65, color: '#43A047', label: 'AI-2', isPlayer: false },
]

export const PLAYER_MOVE_STEP = 0.04

export interface GameState {
  players: PlayerState[]
  discRotation: number
  discTilt: number
  tiltVelocity: number
  balancePercent: number
  rotationCount: number
  score: number
  gameStatus: GameStatus
  startTime: number
  elapsedTime: number
}

interface GameActions {
  setStateFromEngine: (engineState: GameEngineState) => void
  startGame: () => void
  resetGame: () => void
}

export const useGameStore = create<GameState & GameActions>((set) => ({
  players: INITIAL_PLAYERS.map(p => ({ ...p })),
  discRotation: 0,
  discTilt: 0,
  tiltVelocity: 0,
  balancePercent: 100,
  rotationCount: 0,
  score: 0,
  gameStatus: 'idle',
  startTime: 0,
  elapsedTime: 0,

  setStateFromEngine: (engineState: GameEngineState) => {
    set({
      players: engineState.physics.players,
      discRotation: engineState.physics.discRotation,
      discTilt: engineState.physics.discTilt,
      tiltVelocity: engineState.physics.tiltVelocity,
      balancePercent: engineState.physics.balancePercent,
      rotationCount: engineState.physics.rotationCount,
      score: engineState.physics.score,
      gameStatus: engineState.gameStatus,
      startTime: engineState.startTime,
      elapsedTime: engineState.elapsedTime,
    })
  },

  startGame: () => {
  },

  resetGame: () => {
    set({
      players: INITIAL_PLAYERS.map(p => ({ ...p })),
      discRotation: 0,
      discTilt: 0,
      tiltVelocity: 0,
      balancePercent: 100,
      rotationCount: 0,
      score: 0,
      gameStatus: 'idle',
      startTime: 0,
      elapsedTime: 0,
    })
  },
}))
