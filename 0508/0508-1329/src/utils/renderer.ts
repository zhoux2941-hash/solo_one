import { PlayerState } from '@/store/gameStore'

const YI_RED = '#8B2500'
const YI_DARK_RED = '#5C1A00'
const YI_GOLD = '#D4A843'
const YI_DARK_GOLD = '#B8860B'
const YI_BROWN = '#4A2800'
const YI_GREEN = '#2E5D32'
const DISC_COLOR = '#8B6914'
const DISC_DARK = '#6B4F10'
const DISC_RING = '#A0782C'

interface RenderParams {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  players: PlayerState[]
  discRotation: number
  discTilt: number
  balancePercent: number
}

function drawYiBorderPattern(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save()
  ctx.strokeStyle = YI_GOLD
  ctx.lineWidth = 2
  ctx.setLineDash([8, 4])
  ctx.strokeRect(x, y, w, h)
  ctx.setLineDash([])
  ctx.restore()
}

function drawSunPattern(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const rays = 12
  ctx.save()
  ctx.strokeStyle = YI_GOLD
  ctx.lineWidth = 1.5
  ctx.globalAlpha = 0.6
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(angle) * r * 0.3, cy + Math.sin(angle) * r * 0.3)
    ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r)
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2)
  ctx.stroke()
  ctx.globalAlpha = 1
  ctx.restore()
}

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.6)
  grad.addColorStop(0, '#1A0E00')
  grad.addColorStop(0.5, '#0D0700')
  grad.addColorStop(1, '#050200')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  ctx.save()
  ctx.globalAlpha = 0.04
  ctx.strokeStyle = YI_GOLD
  ctx.lineWidth = 1
  for (let i = 0; i < 20; i++) {
    const y = (i / 20) * h
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  ctx.restore()

  drawSunPattern(ctx, 80, 80, 30)
  drawSunPattern(ctx, w - 80, 80, 30)
  drawSunPattern(ctx, 80, h - 80, 30)
  drawSunPattern(ctx, w - 80, h - 80, 30)
}

function drawDisc(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, rotation: number, tilt: number) {
  ctx.save()
  ctx.translate(cx, cy)

  const tiltOffsetX = Math.sin(tilt) * rx * 0.08
  const tiltScaleY = 1 - Math.abs(Math.sin(tilt)) * 0.05

  ctx.translate(tiltOffsetX, 0)
  ctx.scale(1, tiltScaleY)

  const shadowGrad = ctx.createRadialGradient(5, 8, 0, 5, 8, rx * 1.05)
  shadowGrad.addColorStop(0, 'rgba(0,0,0,0.5)')
  shadowGrad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = shadowGrad
  ctx.beginPath()
  ctx.ellipse(5, 8, rx * 1.02, ry * 1.02, 0, 0, Math.PI * 2)
  ctx.fill()

  const discGrad = ctx.createRadialGradient(-rx * 0.2, -ry * 0.2, 0, 0, 0, rx)
  discGrad.addColorStop(0, DISC_RING)
  discGrad.addColorStop(0.3, DISC_COLOR)
  discGrad.addColorStop(0.7, DISC_DARK)
  discGrad.addColorStop(1, YI_DARK_RED)
  ctx.fillStyle = discGrad
  ctx.beginPath()
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.save()
  ctx.clip()
  ctx.rotate(rotation)

  ctx.strokeStyle = YI_GOLD
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.3
  for (let i = 1; i <= 5; i++) {
    ctx.beginPath()
    ctx.ellipse(0, 0, rx * (i / 6), ry * (i / 6), 0, 0, Math.PI * 2)
    ctx.stroke()
  }

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(Math.cos(a) * rx, Math.sin(a) * ry)
    ctx.stroke()
  }

  ctx.globalAlpha = 0.2
  ctx.lineWidth = 3
  ctx.strokeStyle = YI_DARK_RED
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2
    const r1 = rx * 0.82
    const r2 = rx * 0.92
    ctx.beginPath()
    ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1 * (ry / rx))
    ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2 * (ry / rx))
    ctx.stroke()
  }

  ctx.globalAlpha = 1
  ctx.restore()

  ctx.strokeStyle = YI_GOLD
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
  ctx.stroke()

  ctx.strokeStyle = YI_DARK_GOLD
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.ellipse(0, 0, rx * 0.95, ry * 0.95, 0, 0, Math.PI * 2)
  ctx.stroke()

  ctx.restore()
}

function drawLevel(ctx: CanvasRenderingContext2D, cx: number, cy: number, tilt: number, discRx: number) {
  const levelR = Math.min(discRx * 0.15, 40)

  ctx.save()
  ctx.translate(cx, cy)

  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.strokeStyle = YI_GOLD
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(0, 0, levelR, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.strokeStyle = 'rgba(212,168,67,0.3)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(-levelR, 0)
  ctx.lineTo(levelR, 0)
  ctx.moveTo(0, -levelR)
  ctx.lineTo(0, levelR)
  ctx.stroke()

  const bubbleX = Math.sin(tilt) * levelR * 0.6
  const bubbleR = levelR * 0.25

  const bubbleGrad = ctx.createRadialGradient(bubbleX - 2, -2, 0, bubbleX, 0, bubbleR)
  bubbleGrad.addColorStop(0, '#81D4FA')
  bubbleGrad.addColorStop(0.7, '#29B6F6')
  bubbleGrad.addColorStop(1, '#0277BD')
  ctx.fillStyle = bubbleGrad
  ctx.beginPath()
  ctx.arc(bubbleX, 0, bubbleR, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.beginPath()
  ctx.arc(bubbleX - bubbleR * 0.3, -bubbleR * 0.3, bubbleR * 0.3, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

function drawPlayer(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, player: PlayerState, discRotation: number) {
  const worldAngle = player.angle + discRotation
  const px = cx + Math.cos(worldAngle) * player.radius * rx
  const py = cy + Math.sin(worldAngle) * player.radius * ry

  ctx.save()

  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.beginPath()
  ctx.ellipse(px + 2, py + 4, 14, 8, 0, 0, Math.PI * 2)
  ctx.fill()

  const bodyGrad = ctx.createRadialGradient(px - 3, py - 10, 0, px, py - 5, 18)
  bodyGrad.addColorStop(0, player.color)
  bodyGrad.addColorStop(1, shadeColor(player.color, -40))
  ctx.fillStyle = bodyGrad

  ctx.beginPath()
  ctx.ellipse(px, py - 12, 8, 10, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.beginPath()
  ctx.arc(px, py - 26, 7, 0, Math.PI * 2)
  ctx.fill()

  if (player.isPlayer) {
    ctx.strokeStyle = YI_GOLD
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(px, py - 26, 9, 0, Math.PI * 2)
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(px, py - 26, 11, -Math.PI * 0.3, Math.PI * 0.3)
    ctx.stroke()
  }

  ctx.fillStyle = '#FFF'
  ctx.font = `bold ${player.isPlayer ? 13 : 11}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'

  if (player.isPlayer) {
    ctx.fillStyle = YI_GOLD
  }
  ctx.fillText(player.label, px, py - 34)

  ctx.restore()
}

function shadeColor(color: string, amount: number): string {
  const num = parseInt(color.replace('#', ''), 16)
  const r = Math.max(0, Math.min(255, (num >> 16) + amount))
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount))
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount))
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`
}

function drawBalanceIndicator(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, balance: number) {
  ctx.save()

  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.strokeStyle = YI_GOLD
  ctx.lineWidth = 1

  const h = 8
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 4)
  ctx.fill()
  ctx.stroke()

  const barW = Math.max(0, (balance / 100) * (w - 4))
  const barColor = balance > 60 ? '#4CAF50' : balance > 30 ? '#FF9800' : '#F44336'
  const barGrad = ctx.createLinearGradient(x + 2, y, x + 2 + barW, y)
  barGrad.addColorStop(0, barColor)
  barGrad.addColorStop(1, shadeColor(barColor, -30))
  ctx.fillStyle = barGrad
  ctx.beginPath()
  ctx.roundRect(x + 2, y + 2, barW, h - 4, 3)
  ctx.fill()

  ctx.restore()
}

export function render(params: RenderParams) {
  const { ctx, width, height, players, discRotation, discTilt, balancePercent } = params

  ctx.clearRect(0, 0, width, height)

  drawBackground(ctx, width, height)

  const cx = width / 2
  const cy = height / 2
  const discRx = Math.min(width, height) * 0.32
  const discRy = discRx * 0.55

  drawDisc(ctx, cx, cy, discRx, discRy, discRotation, discTilt)
  drawLevel(ctx, cx, cy, discTilt, discRx)

  const sortedPlayers = [...players].sort((a, b) => {
    const ay = Math.sin(a.angle + discRotation)
    const by = Math.sin(b.angle + discRotation)
    return ay - by
  })
  for (const p of sortedPlayers) {
    drawPlayer(ctx, cx, cy, discRx, discRy, p, discRotation)
  }

  drawBalanceIndicator(ctx, cx - 80, cy + discRy + 40, 160, balancePercent)

  drawYiBorderPattern(ctx, 10, 10, width - 20, height - 20)
}
