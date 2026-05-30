export function resizeCanvas(canvas: HTMLCanvasElement, width: number, height: number): void {
  const dpr = window.devicePixelRatio || 1
  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.scale(dpr, dpr)
  }
}

export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number, color?: string): void {
  if (color) {
    ctx.fillStyle = color
    ctx.fillRect(0, 0, width, height)
  } else {
    ctx.clearRect(0, 0, width, height)
  }
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gridSize: number = 40,
  color: string = 'rgba(255,255,255,0.1)'
): void {
  ctx.strokeStyle = color
  ctx.lineWidth = 1

  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }

  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
}

export function drawAxes(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string = 'rgba(255,255,255,0.3)'
): void {
  const centerX = width / 2
  const centerY = height / 2

  ctx.strokeStyle = color
  ctx.lineWidth = 2

  ctx.beginPath()
  ctx.moveTo(0, centerY)
  ctx.lineTo(width, centerY)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(centerX, 0)
  ctx.lineTo(centerX, height)
  ctx.stroke()
}

export function setGlow(ctx: CanvasRenderingContext2D, color: string, blur: number = 15): void {
  ctx.shadowColor = color
  ctx.shadowBlur = blur
}

export function clearGlow(ctx: CanvasRenderingContext2D): void {
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
}
