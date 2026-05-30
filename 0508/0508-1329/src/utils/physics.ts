import type { PlayerState } from '@/store/gameStore'

const MAX_TILT = Math.PI / 6
const BASE_ROTATION_SPEED = 0.5
const SLIDE_FACTOR = 0.0015
const TILT_DAMPING = 0.92
const AI_MOVE_SPEED = 0.8
const AI_COOLDOWN_TIME = 0.6
const TORQUE_GAIN = 8
const SCORE_PER_SECOND = 10

export interface PhysicsState {
  players: PlayerState[]
  discRotation: number
  discTilt: number
  tiltVelocity: number
  balancePercent: number
  rotationCount: number
  score: number
  ai1Cooldown: number
  ai2Cooldown: number
}

function calculateTorque(players: PlayerState[]): number {
  let torque = 0
  for (const p of players) {
    torque += p.weight * p.radius * Math.sin(p.angle)
  }
  return (torque / 1000) * TORQUE_GAIN
}

function calculateBalance(tilt: number): number {
  const absTilt = Math.abs(tilt)
  return Math.max(0, Math.min(100, 100 * (1 - absTilt / MAX_TILT)))
}

export function createInitialPhysicsState(players: PlayerState[]): PhysicsState {
  return {
    players: players.map(p => ({ ...p })),
    discRotation: 0,
    discTilt: 0,
    tiltVelocity: 0,
    balancePercent: 100,
    rotationCount: 0,
    score: 0,
    ai1Cooldown: 0,
    ai2Cooldown: 0,
  }
}

export function updatePhysics(state: PhysicsState, dt: number): PhysicsState {
  const players = state.players.map(p => ({ ...p }))

  let newAi1Cooldown = state.ai1Cooldown - dt
  let newAi2Cooldown = state.ai2Cooldown - dt

  const tilt = state.discTilt

  if (newAi1Cooldown <= 0) {
    const ai1Idx = players.findIndex((p, i) => !p.isPlayer && i === 1)
    if (ai1Idx >= 0) {
      const correction = tilt > 0 ? -AI_MOVE_SPEED * dt * 1.5 : AI_MOVE_SPEED * dt * 1.5
      players[ai1Idx].angle += correction * (0.5 + Math.random() * 0.5)
      players[ai1Idx].angle = ((players[ai1Idx].angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
    }
    newAi1Cooldown = AI_COOLDOWN_TIME * (0.8 + Math.random() * 0.6)
  }

  if (newAi2Cooldown <= 0) {
    const ai2Idx = players.findIndex((p, i) => !p.isPlayer && i === 2)
    if (ai2Idx >= 0) {
      const correction = tilt > 0 ? -AI_MOVE_SPEED * dt * 1.5 : AI_MOVE_SPEED * dt * 1.5
      players[ai2Idx].angle += correction * (0.5 + Math.random() * 0.5)
      players[ai2Idx].angle = ((players[ai2Idx].angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
    }
    newAi2Cooldown = AI_COOLDOWN_TIME * (0.8 + Math.random() * 0.6)
  }

  for (const p of players) {
    if (!p.isPlayer) {
      p.angle += SLIDE_FACTOR * tilt * p.weight * dt
      p.angle = ((p.angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
    }
  }

  const torque = calculateTorque(players)
  let newTiltVelocity = state.tiltVelocity + torque * dt
  let newTilt = state.discTilt + newTiltVelocity * dt

  newTilt = Math.max(-MAX_TILT * 1.5, Math.min(MAX_TILT * 1.5, newTilt))
  newTiltVelocity *= TILT_DAMPING

  const balance = calculateBalance(newTilt)

  const balanceFactor = balance / 100
  const newDiscRotation = state.discRotation + BASE_ROTATION_SPEED * balanceFactor * dt
  const newCount = Math.floor(newDiscRotation / (2 * Math.PI))

  const newScore = state.score + SCORE_PER_SECOND * balanceFactor * dt

  return {
    players,
    discRotation: newDiscRotation,
    discTilt: newTilt,
    tiltVelocity: newTiltVelocity,
    balancePercent: balance,
    rotationCount: newCount,
    score: Math.floor(newScore),
    ai1Cooldown: newAi1Cooldown,
    ai2Cooldown: newAi2Cooldown,
  }
}

export function movePlayer(state: PhysicsState, direction: number, step: number): PhysicsState {
  const players = state.players.map(p => ({ ...p }))
  const playerIdx = players.findIndex(p => p.isPlayer)
  if (playerIdx >= 0) {
    players[playerIdx].angle += direction * step
    players[playerIdx].angle = ((players[playerIdx].angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  }
  return { ...state, players }
}
