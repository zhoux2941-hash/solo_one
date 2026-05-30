import { useRef } from 'react'

export function useGameLoop() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  return canvasRef
}
