import { useRef, useEffect, useCallback } from 'react'
import { ZoomIn, ZoomOut } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export default function DualView() {
  const originalImage = useAppStore((s) => s.originalImage)
  const processedImage = useAppStore((s) => s.processedImage)
  const zoom = useAppStore((s) => s.zoom)
  const setZoom = useAppStore((s) => s.setZoom)

  const leftCanvasRef = useRef<HTMLCanvasElement>(null)
  const rightCanvasRef = useRef<HTMLCanvasElement>(null)
  const leftContainerRef = useRef<HTMLDivElement>(null)
  const rightContainerRef = useRef<HTMLDivElement>(null)
  const panRef = useRef({ x: 0, y: 0 })
  const isDragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  const drawOnCanvas = useCallback(
    (canvas: HTMLCanvasElement | null, container: HTMLDivElement | null, src: string | null) => {
      if (!canvas || !container || !src) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const img = new Image()
      img.onload = () => {
        const cw = container.clientWidth
        const ch = container.clientHeight
        canvas.width = cw
        canvas.height = ch

        ctx.fillStyle = '#1a1a2e'
        ctx.fillRect(0, 0, cw, ch)

        const scale = Math.min(cw / img.width, ch / img.height) * zoom * 0.9
        const w = img.width * scale
        const h = img.height * scale
        const x = (cw - w) / 2 + panRef.current.x
        const y = (ch - h) / 2 + panRef.current.y

        ctx.drawImage(img, x, y, w, h)
      }
      img.src = src
    },
    [zoom]
  )

  useEffect(() => {
    drawOnCanvas(leftCanvasRef.current, leftContainerRef.current, originalImage)
    drawOnCanvas(rightCanvasRef.current, rightContainerRef.current, processedImage)
  }, [originalImage, processedImage, zoom, drawOnCanvas])

  useEffect(() => {
    const handleResize = () => {
      drawOnCanvas(leftCanvasRef.current, leftContainerRef.current, originalImage)
      drawOnCanvas(rightCanvasRef.current, rightContainerRef.current, processedImage)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [originalImage, processedImage, drawOnCanvas])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging.current) return
      const dx = e.clientX - lastPos.current.x
      const dy = e.clientY - lastPos.current.y
      lastPos.current = { x: e.clientX, y: e.clientY }
      panRef.current = { x: panRef.current.x + dx, y: panRef.current.y + dy }
      drawOnCanvas(leftCanvasRef.current, leftContainerRef.current, originalImage)
      drawOnCanvas(rightCanvasRef.current, rightContainerRef.current, processedImage)
    },
    [originalImage, processedImage, drawOnCanvas]
  )

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
  }, [])

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setZoom(Math.max(0.2, Math.min(5, zoom + delta)))
    },
    [zoom, setZoom]
  )

  const renderPanel = (
    label: string,
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    containerRef: React.RefObject<HTMLDivElement | null>,
    src: string | null
  ) => (
    <div
      ref={containerRef}
      className="relative flex-1 h-full canvas-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded bg-ink/80 border border-gold/20">
        <span className="text-xs font-serif text-gold tracking-wider">{label}</span>
      </div>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )

  return (
    <div className="flex-1 flex relative overflow-hidden">
      {renderPanel('原图', leftCanvasRef, leftContainerRef, originalImage)}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gold/20 z-10 pointer-events-none" />
      {renderPanel('反转图', rightCanvasRef, rightContainerRef, processedImage)}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        <button
          onClick={() => setZoom(Math.max(0.2, zoom - 0.2))}
          className="w-8 h-8 rounded bg-ink/80 border border-gold/20 flex items-center justify-center text-gold/70 hover:text-gold hover:border-gold/40 transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs text-paper/50 min-w-[3rem] text-center font-sans">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(Math.min(5, zoom + 0.2))}
          className="w-8 h-8 rounded bg-ink/80 border border-gold/20 flex items-center justify-center text-gold/70 hover:text-gold hover:border-gold/40 transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
