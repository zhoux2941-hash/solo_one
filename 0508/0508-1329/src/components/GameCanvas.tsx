import { useGameLoop } from '@/hooks/useGameLoop'
import { useInput } from '@/hooks/useInput'

export default function GameCanvas() {
  useInput()
  const canvasRef = useGameLoop()

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  )
}

export { useGameLoop }
