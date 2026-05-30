import { useRef, useEffect, useCallback } from 'react'
import { useDrumTowerStore } from '@/hooks/useDrumTowerStore'
import { getStrikeAngle } from '@/hooks/useAnimationStateMachine'
import { playSingleBellSound, playSingleDrumSound } from '@/utils/audio'
import type { AnimationState } from '../../shared/types'

function drawGear(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  teeth: number,
  rotation: number,
  color: string
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.beginPath()
  for (let i = 0; i < teeth * 2; i++) {
    const angle = (i * Math.PI) / teeth
    const r = i % 2 === 0 ? radius : radius * 0.75
    const px = Math.cos(angle) * r
    const py = Math.sin(angle) * r
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = '#8B7355'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(0, 0, radius * 0.2, 0, Math.PI * 2)
  ctx.fillStyle = '#5C4033'
  ctx.fill()
  ctx.restore()
}

function drawRope(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  sag: number
) {
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  const cx = (x1 + x2) / 2
  const cy = (y1 + y2) / 2 + sag
  ctx.quadraticCurveTo(cx, cy, x2, y2)
  ctx.strokeStyle = '#A0855B'
  ctx.lineWidth = 2.5
  ctx.stroke()
}

function drawHammerArm(
  ctx: CanvasRenderingContext2D,
  pivotX: number,
  pivotY: number,
  targetX: number,
  targetY: number,
  angle: number,
  type: 'bell' | 'drum'
) {
  ctx.save()
  ctx.translate(pivotX, pivotY)

  const dx = targetX - pivotX
  const dy = targetY - pivotY
  const baseAngle = Math.atan2(dy, dx)
  const armLength = Math.sqrt(dx * dx + dy * dy)

  const finalAngle = baseAngle + angle
  ctx.rotate(finalAngle)

  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(armLength, 0)
  ctx.strokeStyle = '#5C4033'
  ctx.lineWidth = 4
  ctx.stroke()

  const jointX = armLength * 0.6
  ctx.beginPath()
  ctx.moveTo(jointX, 0)
  ctx.lineTo(armLength, 0)
  ctx.strokeStyle = '#8B6914'
  ctx.lineWidth = 5
  ctx.stroke()

  const headColor = type === 'bell' ? '#B8860B' : '#8B0000'
  ctx.beginPath()
  if (type === 'bell') {
    ctx.arc(armLength, 0, 10, 0, Math.PI * 2)
  } else {
    ctx.ellipse(armLength, 0, 8, 12, 0, 0, Math.PI * 2)
  }
  ctx.fillStyle = headColor
  ctx.fill()
  ctx.strokeStyle = '#3C1810'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.restore()
}

function getStateProgress(state: AnimationState, progress: number, type: 'bell' | 'drum', isActive: boolean): number {
  if (!isActive) return 0
  const stateWeights: Record<AnimationState, number> = {
    IDLE: 0,
    WINDUP: 0.3,
    STRIKE: 0.1,
    RECOVER: 0.25,
  }
  const total = 0.3 + 0.1 + 0.25
  const stateOrder: AnimationState[] = ['IDLE', 'WINDUP', 'STRIKE', 'RECOVER']
  let accumulated = 0
  for (const s of stateOrder) {
    if (s === state) {
      return (accumulated + stateWeights[s] * progress) / total
    }
    accumulated += stateWeights[s]
    if (s === 'IDLE') accumulated = 0
  }
  return 0
}

export default function MechanicalCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const animation = useDrumTowerStore((s) => s.animation)
  const lastImpactRef = useRef(false)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    const bgGrad = ctx.createLinearGradient(0, 0, 0, h)
    bgGrad.addColorStop(0, '#1A1A2E')
    bgGrad.addColorStop(1, '#16213E')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, w, h)

    ctx.strokeStyle = '#2C3E50'
    ctx.lineWidth = 0.5
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }

    const isActive = animation.isActive
    const activeType = animation.type
    const state = animation.state
    const progress = animation.progress

    const overallProgress = getStateProgress(state, progress, activeType as 'bell' | 'drum', isActive)
    const gearRotation1 = overallProgress * Math.PI * 4
    const gearRotation2 = -overallProgress * Math.PI * 4 * 1.5
    const gearRotation3 = overallProgress * Math.PI * 4 * 0.5

    const bellCenterX = w * 0.62
    const bellCenterY = h * 0.2
    const bellPivotX = w * 0.45
    const bellPivotY = h * 0.2
    const bellIsActive = isActive && activeType === 'bell'
    const bellAngle = bellIsActive ? getStrikeAngle(state, progress, 0.6) : 0

    const drumCenterX = w * 0.62
    const drumCenterY = h * 0.55
    const drumPivotX = w * 0.45
    const drumPivotY = h * 0.55
    const drumIsActive = isActive && activeType === 'drum'
    const drumAngle = drumIsActive ? getStrikeAngle(state, progress, 0.6) : 0

    drawGear(ctx, w * 0.12, h * 0.45, 30, 12, gearRotation1, '#8B7355')
    drawGear(ctx, w * 0.22, h * 0.45, 20, 8, gearRotation2, '#A0855B')
    drawGear(ctx, w * 0.12, h * 0.7, 22, 10, gearRotation3, '#7B6545')

    const ropeSag = isActive ? 8 + Math.sin(overallProgress * Math.PI * 6) * 5 : 12
    drawRope(ctx, w * 0.22, h * 0.45, bellPivotX, bellPivotY - 10, ropeSag)
    drawRope(ctx, w * 0.12, h * 0.7, drumPivotX, drumPivotY - 10, ropeSag)

    drawHammerArm(ctx, bellPivotX, bellPivotY, bellCenterX - 25, bellCenterY, bellAngle, 'bell')
    drawHammerArm(ctx, drumPivotX, drumPivotY, drumCenterX - 25, drumCenterY, drumAngle, 'drum')

    ctx.beginPath()
    ctx.arc(w * 0.62, h * 0.2, 35, 0, Math.PI * 2)
    ctx.fillStyle = '#B8860B'
    ctx.fill()
    ctx.strokeStyle = '#8B6914'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(w * 0.62, h * 0.2, 30, 0, Math.PI * 2)
    ctx.fillStyle = '#DAA520'
    ctx.globalAlpha = 0.3
    ctx.fill()
    ctx.globalAlpha = 1

    ctx.beginPath()
    ctx.ellipse(w * 0.62, h * 0.55, 30, 40, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#8B0000'
    ctx.fill()
    ctx.strokeStyle = '#5C0000'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(w * 0.62, h * 0.55, 25, 35, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#D4A574'
    ctx.globalAlpha = 0.3
    ctx.fill()
    ctx.globalAlpha = 1

    drawRope(ctx, w * 0.62 + 30, h * 0.2, w * 0.82, h * 0.3, ropeSag * 0.7)
    drawRope(ctx, w * 0.62 + 30, h * 0.55, w * 0.82, h * 0.6, ropeSag * 0.7)

    drawGear(ctx, w * 0.88, h * 0.35, 18, 6, -gearRotation1, '#6B5B45')
    drawGear(ctx, w * 0.88, h * 0.55, 14, 8, gearRotation2, '#8B7355')

    if (isActive) {
      ctx.fillStyle = activeType === 'bell' ? '#DAA520' : '#FF4500'
      ctx.globalAlpha = 0.3 + Math.sin(overallProgress * Math.PI * 4) * 0.2
      ctx.beginPath()
      ctx.arc(w * 0.62, activeType === 'bell' ? h * 0.2 : h * 0.55, 50, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }

    ctx.font = '11px "Noto Serif SC", serif'
    ctx.fillStyle = '#8B9DAF'
    ctx.textAlign = 'left'
    const labels = [
      [w * 0.12, h * 0.92, '主传动齿轮'],
      [w * 0.42, h * 0.08, '锤臂机构'],
      [w * 0.62, h * 0.08, activeType === 'bell' && isActive ? '钟 ✓' : '钟'],
      [w * 0.62, h * 0.95, activeType === 'drum' && isActive ? '鼓 ✓' : '鼓'],
    ]
    labels.forEach(([x, y, text]) => {
      ctx.fillText(text as string, x as number, y as number)
    })

    if (isActive) {
      ctx.font = 'bold 13px "Noto Serif SC", serif'
      ctx.fillStyle = activeType === 'bell' ? '#DAA520' : '#FF4500'
      ctx.textAlign = 'right'
      const stateLabel: Record<string, string> = {
        IDLE: '待机',
        WINDUP: '蓄力',
        STRIKE: '击打',
        RECOVER: '复位',
      }
      ctx.fillText(
        `${activeType === 'bell' ? '🔊 钟声' : '🪘 鼓声'} · ${stateLabel[state]} · ${animation.currentStrike}/${animation.totalStrikes}`,
        w - 20,
        20
      )
    }
  }, [animation])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.scale(dpr, dpr)
    draw()
  }, [draw])

  useEffect(() => {
    const animate = () => {
      draw()
      if (animation.isActive && animation.state === 'STRIKE' && animation.progress >= 0.5 && !lastImpactRef.current) {
        lastImpactRef.current = true
        if (animation.type === 'bell') {
          playSingleBellSound()
        } else if (animation.type === 'drum') {
          playSingleDrumSound()
        }
      }
      if (animation.state !== 'STRIKE' || animation.progress < 0.5) {
        lastImpactRef.current = false
      }
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [draw, animation])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: 'block' }}
    />
  )
}
