import { useEffect, useRef } from 'react'
import { useGame } from '@/components/GameProvider'

export function useInput() {
  const intervalRef = useRef<number | null>(null)
  const directionRef = useRef<number>(0)
  const { movePlayer } = useGame()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (directionRef.current !== -1) {
          directionRef.current = -1
          movePlayer(-1)
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
          }
          intervalRef.current = window.setInterval(() => {
            movePlayer(-1)
          }, 16)
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        if (directionRef.current !== 1) {
          directionRef.current = 1
          movePlayer(1)
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
          }
          intervalRef.current = window.setInterval(() => {
            movePlayer(1)
          }, 16)
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && directionRef.current === -1) {
        directionRef.current = 0
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      } else if (e.key === 'ArrowRight' && directionRef.current === 1) {
        directionRef.current = 0
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }

    const handleBlur = () => {
      directionRef.current = 0
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [movePlayer])
}
