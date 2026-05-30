import { createContext, useContext, useRef, useCallback, useEffect, type ReactNode } from 'react'
import { GameEngine, type GameEngineState } from '@/utils/gameEngine'
import { createInitialPhysicsState } from '@/utils/physics'
import { useGameStore, INITIAL_PLAYERS, PLAYER_MOVE_STEP } from '@/store/gameStore'
import { render } from '@/utils/renderer'

interface GameContextValue {
  startGame: () => void
  resetGame: () => void
  movePlayer: (direction: number) => void
  getEngineState: () => GameEngineState | null
}

const GameContext = createContext<GameContextValue | null>(null)

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) {
    throw new Error('useGame must be used within GameProvider')
  }
  return ctx
}

export function GameProvider({ children, canvasRef }: { children: ReactNode; canvasRef: React.RefObject<HTMLCanvasElement> }) {
  const engineRef = useRef<GameEngine | null>(null)
  const frameRef = useRef<number>(0)
  const setStateFromEngine = useGameStore(s => s.setStateFromEngine)

  const getInitialPhysics = useCallback(() => {
    return createInitialPhysicsState(INITIAL_PLAYERS)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const dpr = window.devicePixelRatio || 1
      canvas.width = parent.clientWidth * dpr
      canvas.height = parent.clientHeight * dpr
      canvas.style.width = `${parent.clientWidth}px`
      canvas.style.height = `${parent.clientHeight}px`
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    engineRef.current = new GameEngine(
      getInitialPhysics(),
      (engineState) => {
        setStateFromEngine(engineState)
      }
    )

    const renderLoop = () => {
      const ctx = canvas.getContext('2d')
      if (ctx && engineRef.current) {
        const state = engineRef.current.getState()
        const dpr = window.devicePixelRatio || 1
        const w = canvas.width / dpr
        const h = canvas.height / dpr

        ctx.save()
        render({
          ctx,
          width: w,
          height: h,
          players: state.physics.players,
          discRotation: state.physics.discRotation,
          discTilt: state.physics.discTilt,
          balancePercent: state.physics.balancePercent,
        })
        ctx.restore()
      }
      frameRef.current = requestAnimationFrame(renderLoop)
    }

    frameRef.current = requestAnimationFrame(renderLoop)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(frameRef.current)
      if (engineRef.current) {
        engineRef.current.destroy()
        engineRef.current = null
      }
    }
  }, [canvasRef, getInitialPhysics, setStateFromEngine])

  const startGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.start(getInitialPhysics())
    }
  }, [getInitialPhysics])

  const resetGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.reset(getInitialPhysics())
    }
  }, [getInitialPhysics])

  const movePlayer = useCallback((direction: number) => {
    if (engineRef.current) {
      engineRef.current.applyPlayerMove(direction, PLAYER_MOVE_STEP)
    }
  }, [])

  const getEngineState = useCallback(() => {
    return engineRef.current ? engineRef.current.getState() : null
  }, [])

  return (
    <GameContext.Provider value={{ startGame, resetGame, movePlayer, getEngineState }}>
      {children}
    </GameContext.Provider>
  )
}
