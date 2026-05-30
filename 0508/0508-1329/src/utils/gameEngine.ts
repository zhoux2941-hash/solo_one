import { updatePhysics, movePlayer, type PhysicsState } from '@/utils/physics'

export type GameStatus = 'idle' | 'playing' | 'ended'

export const PHYSICS_FPS = 60
export const PHYSICS_DT = 1 / PHYSICS_FPS

export interface GameEngineState {
  physics: PhysicsState
  gameStatus: GameStatus
  startTime: number
  elapsedTime: number
}

export class GameEngine {
  private rafId: number | null = null
  private lastTime: number = 0
  private accumulator: number = 0
  private running: boolean = false

  private state: GameEngineState
  private onStateChange: (state: GameEngineState) => void

  constructor(
    initialPhysics: PhysicsState,
    onStateChange: (state: GameEngineState) => void
  ) {
    this.state = {
      physics: initialPhysics,
      gameStatus: 'idle',
      startTime: 0,
      elapsedTime: 0,
    }
    this.onStateChange = onStateChange
  }

  start(initialPhysics: PhysicsState): void {
    this.state = {
      physics: initialPhysics,
      gameStatus: 'playing',
      startTime: Date.now(),
      elapsedTime: 0,
    }
    this.accumulator = 0
    this.lastTime = 0
    this.running = true
    this.notifyChange()

    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(this.loop.bind(this))
    }
  }

  stop(): void {
    this.running = false
    if (this.state.gameStatus === 'playing') {
      this.state.gameStatus = 'ended'
      this.notifyChange()
    }
  }

  reset(initialPhysics: PhysicsState): void {
    this.stop()
    this.state = {
      physics: initialPhysics,
      gameStatus: 'idle',
      startTime: 0,
      elapsedTime: 0,
    }
    this.notifyChange()
  }

  private loop(time: number): void {
    if (this.lastTime === 0) {
      this.lastTime = time
    }

    let frameTime = (time - this.lastTime) / 1000
    frameTime = Math.min(frameTime, 0.1)
    this.lastTime = time

    if (this.running && this.state.gameStatus === 'playing') {
      this.accumulator += frameTime

      while (this.accumulator >= PHYSICS_DT) {
        this.tick(PHYSICS_DT)
        this.accumulator -= PHYSICS_DT
      }

      if (this.state.physics.balancePercent <= 0) {
        this.stop()
      }
    }

    this.notifyChange()
    this.rafId = requestAnimationFrame(this.loop.bind(this))
  }

  private tick(dt: number): void {
    this.state.physics = updatePhysics(this.state.physics, dt)
    this.state.elapsedTime = (Date.now() - this.state.startTime) / 1000
  }

  applyPlayerMove(direction: number, step: number): void {
    if (this.state.gameStatus !== 'playing') return
    this.state.physics = movePlayer(this.state.physics, direction, step)
    this.notifyChange()
  }

  getState(): GameEngineState {
    return { ...this.state }
  }

  private notifyChange(): void {
    this.onStateChange({ ...this.state })
  }

  destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.running = false
  }
}
