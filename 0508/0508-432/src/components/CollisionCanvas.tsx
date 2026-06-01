import { useRef, useEffect } from 'react';
import { useSimulationStore } from '@/store/simulationStore';
import { MATERIAL_PRESETS } from '@/utils/physics';

interface BallState {
  x: number;
  y: number;
  vx: number;
  radius: number;
  color: string;
  squash: number;
}

type AnimPhase = 'idle' | 'approaching' | 'colliding' | 'separating' | 'sticking' | 'done';

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.06)';
  ctx.lineWidth = 1;
  const step = 40;
  for (let x = 0; x < w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

function drawCenterLine(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function darkenColor(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.floor(r * factor)},${Math.floor(g * factor)},${Math.floor(b * factor)})`;
}

function drawBall(ctx: CanvasRenderingContext2D, ball: BallState, label: string) {
  ctx.save();
  ctx.translate(ball.x, ball.y);

  const sx = 1 + ball.squash * 0.3;
  const sy = 1 - ball.squash * 0.15;
  ctx.scale(sx, sy);

  const gradient = ctx.createRadialGradient(
    -ball.radius * 0.3, -ball.radius * 0.3, ball.radius * 0.1,
    0, 0, ball.radius
  );
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.3, ball.color);
  gradient.addColorStop(1, darkenColor(ball.color, 0.4));

  ctx.beginPath();
  ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.shadowColor = ball.color;
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
  ctx.strokeStyle = ball.color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.scale(1 / sx, 1 / sy);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.max(12, ball.radius * 0.5)}px 'Space Grotesk', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, 0);

  ctx.restore();
}

function drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, vx: number, color: string) {
  if (Math.abs(vx) < 0.01) return;
  const arrowLen = Math.min(Math.abs(vx) * 12, 80);
  const dir = vx > 0 ? 1 : -1;
  const endX = x + arrowLen * dir;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, y);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(endX, y);
  ctx.lineTo(endX - 8 * dir, y - 5);
  ctx.lineTo(endX - 8 * dir, y + 5);
  ctx.closePath();
  ctx.fill();

  ctx.font = "11px 'JetBrains Mono', monospace";
  ctx.textAlign = 'center';
  ctx.fillText(`v=${vx.toFixed(1)}`, x + arrowLen * dir * 0.5, y - 12);
}

function drawSparks(ctx: CanvasRenderingContext2D, x: number, y: number, intensity: number, frame: number) {
  const count = Math.floor(intensity * 12);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + frame * 0.08;
    const dist = intensity * 35 * (1 + Math.sin(frame * 0.3 + i * 0.7) * 0.6);
    const sx = x + Math.cos(angle) * dist;
    const sy = y + Math.sin(angle) * dist;
    const alpha = Math.max(0, intensity * (1 - (frame % 12) / 12));
    const hue = 30 + (i * 15) % 30;
    ctx.fillStyle = `hsla(${hue}, 100%, 65%, ${alpha})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 1.5 + intensity * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawShockwave(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
  if (progress >= 1) return;
  const maxRadius = 80;
  const radius = maxRadius * progress;
  const alpha = (1 - progress) * 0.4;
  ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
  ctx.lineWidth = 2 * (1 - progress);
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
}

function drawStickBond(ctx: CanvasRenderingContext2D, x: number, y: number, r1: number, r2: number) {
  const cx = x;
  const bondH = Math.min(r1, r2) * 0.6;
  ctx.fillStyle = 'rgba(255, 107, 53, 0.25)';
  ctx.beginPath();
  ctx.moveTo(cx, y - bondH);
  ctx.quadraticCurveTo(cx + 4, y, cx, y + bondH);
  ctx.quadraticCurveTo(cx - 4, y, cx, y - bondH);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 107, 53, 0.5)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(cx, y - bondH * 1.3);
  ctx.lineTo(cx, y + bondH * 1.3);
  ctx.stroke();
  ctx.setLineDash([]);
}

export default function CollisionCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const ball1Ref = useRef<BallState | null>(null);
  const ball2Ref = useRef<BallState | null>(null);
  const phaseRef = useRef<AnimPhase>('idle');
  const collisionXRef = useRef(0);
  const sparkFrameRef = useRef(0);
  const prevRunningRef = useRef(false);
  const shockwaveRef = useRef(1);

  const storeRef = useRef(useSimulationStore.getState());
  const restitutionRef = useRef(0);
  useEffect(() => {
    const unsub = useSimulationStore.subscribe((state) => {
      storeRef.current = state;
      restitutionRef.current = state.restitution;
    });
    restitutionRef.current = useSimulationStore.getState().restitution;
    return unsub;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let frameCount = 0;

    const animate = () => {
      const state = storeRef.current;
      const { v1, v2, m1, m2, material1, material2, isRunning, result, setPhase } = state;
      const w = canvas.width;
      const h = canvas.height;

      if (isRunning && !prevRunningRef.current) {
        const r1 = Math.max(20, Math.min(50, 15 + m1 * 5));
        const r2 = Math.max(20, Math.min(50, 15 + m2 * 5));
        const c1 = MATERIAL_PRESETS[material1].color;
        const c2 = MATERIAL_PRESETS[material2].color;

        ball1Ref.current = { x: w * 0.2, y: h / 2, vx: v1 * 15, radius: r1, color: c1, squash: 0 };
        ball2Ref.current = { x: w * 0.8, y: h / 2, vx: v2 * 15, radius: r2, color: c2, squash: 0 };
        phaseRef.current = 'approaching';
        sparkFrameRef.current = 0;
        shockwaveRef.current = 1;
        frameCount = 0;
        setPhase('approaching');
      }

      if (!isRunning && prevRunningRef.current) {
        ball1Ref.current = null;
        ball2Ref.current = null;
        phaseRef.current = 'idle';
        frameCount = 0;
      }
      prevRunningRef.current = isRunning;

      ctx.fillStyle = '#0a0e1a';
      ctx.fillRect(0, 0, w, h);
      drawGrid(ctx, w, h);
      drawCenterLine(ctx, w, h);

      const b1 = ball1Ref.current;
      const b2 = ball2Ref.current;

      if (b1 && b2 && isRunning) {
        if (phaseRef.current === 'approaching') {
          const dt = 0.016;
          const nextX1 = b1.x + b1.vx * dt;
          const nextX2 = b2.x + b2.vx * dt;
          const minDist = b1.radius + b2.radius;
          const currentDist = b2.x - b1.x;
          const nextDist = nextX2 - nextX1;

          let willCollide = false;
          let collisionFraction = 1;

          if (nextDist <= minDist && currentDist > minDist) {
            const closingSpeed = b1.vx - b2.vx;
            if (closingSpeed > 0.001) {
              const overlap = currentDist - minDist;
              const timeToCollision = overlap / closingSpeed;
              if (timeToCollision >= 0 && timeToCollision <= dt) {
                collisionFraction = timeToCollision / dt;
                willCollide = true;
              }
            }
          }

          if (willCollide) {
            b1.x += b1.vx * dt * collisionFraction;
            b2.x += b2.vx * dt * collisionFraction;
            phaseRef.current = 'colliding';
            collisionXRef.current = (b1.x + b2.x) / 2;
            sparkFrameRef.current = 0;
            shockwaveRef.current = 0;
            setPhase('colliding');
          } else {
            b1.x = nextX1;
            b2.x = nextX2;
          }

          b1.squash = 0;
          b2.squash = 0;
        } else if (phaseRef.current === 'colliding') {
          sparkFrameRef.current++;
          const intensity = Math.max(0, 1 - sparkFrameRef.current / 18);
          b1.squash = intensity * 0.8;
          b2.squash = intensity * 0.8;

          const isSticking = restitutionRef.current < 0.01;

          if (result) {
            if (isSticking) {
              b1.x = collisionXRef.current - b1.radius;
              b2.x = collisionXRef.current + b2.radius;
            } else {
              const pushOut = (1 - intensity) * 3;
              b1.x = collisionXRef.current - b1.radius - pushOut;
              b2.x = collisionXRef.current + b2.radius + pushOut;
            }
          }

          if (sparkFrameRef.current > 18) {
            if (result) {
              b1.vx = result.v1After * 15;
              b2.vx = result.v2After * 15;
            }
            if (isSticking) {
              phaseRef.current = 'sticking';
              setPhase('sticking');
            } else {
              phaseRef.current = 'separating';
              setPhase('separating');
            }
          }
        } else if (phaseRef.current === 'sticking') {
          const sharedVx = result ? result.v1After * 15 : 0;
          b1.x += sharedVx * 0.016;
          b2.x += sharedVx * 0.016;
          b1.squash = 0;
          b2.squash = 0;

          const outOfBounds = b1.x < -100 || b1.x > w + 100;
          const stopped = Math.abs(sharedVx) < 0.5;
          if (outOfBounds || stopped || frameCount > 500) {
            phaseRef.current = 'done';
            setPhase('done');
          }
        } else if (phaseRef.current === 'separating') {
          b1.x += b1.vx * 0.016;
          b2.x += b2.vx * 0.016;
          b1.squash = Math.max(0, b1.squash - 0.05);
          b2.squash = Math.max(0, b2.squash - 0.05);

          const outOfBounds = b1.x < -100 || b1.x > w + 100 || b2.x < -100 || b2.x > w + 100;
          const stopped = Math.abs(b1.vx) < 0.5 && Math.abs(b2.vx) < 0.5;
          if (outOfBounds || stopped || frameCount > 500) {
            phaseRef.current = 'done';
            setPhase('done');
          }
        }

        if (phaseRef.current === 'colliding') {
          const intensity = Math.max(0, 1 - sparkFrameRef.current / 18);
          drawSparks(ctx, collisionXRef.current, h / 2, intensity, sparkFrameRef.current);
        }

        if (shockwaveRef.current < 1) {
          shockwaveRef.current += 0.04;
          drawShockwave(ctx, collisionXRef.current, h / 2, shockwaveRef.current);
        }

        drawBall(ctx, b1, 'm₁');
        drawBall(ctx, b2, 'm₂');

        if (phaseRef.current === 'sticking') {
          const bondX = (b1.x + b1.radius + b2.x - b2.radius) / 2;
          drawStickBond(ctx, bondX, h / 2, b1.radius, b2.radius);
        }

        if (phaseRef.current === 'sticking') {
          const sharedV = result ? result.v1After : 0;
          const midX = (b1.x + b2.x) / 2;
          drawArrow(ctx, midX, b1.y - b1.radius - 20, sharedV, '#00e5ff');
        } else if (phaseRef.current !== 'colliding') {
          drawArrow(ctx, b1.x, b1.y - b1.radius - 20, b1.vx / 15, '#00e5ff');
          drawArrow(ctx, b2.x, b2.y - b2.radius - 20, b2.vx / 15, '#ff6b35');
        }
      }

      if (!isRunning) {
        const r1 = Math.max(20, Math.min(50, 15 + m1 * 5));
        const r2 = Math.max(20, Math.min(50, 15 + m2 * 5));
        const c1 = MATERIAL_PRESETS[material1].color;
        const c2 = MATERIAL_PRESETS[material2].color;

        const idleB1: BallState = { x: w * 0.35, y: h / 2, vx: 0, radius: r1, color: c1, squash: 0 };
        const idleB2: BallState = { x: w * 0.65, y: h / 2, vx: 0, radius: r2, color: c2, squash: 0 };
        drawBall(ctx, idleB1, 'm₁');
        drawBall(ctx, idleB2, 'm₂');

        drawArrow(ctx, idleB1.x, idleB1.y - idleB1.radius - 20, v1, '#00e5ff');
        drawArrow(ctx, idleB2.x, idleB2.y - idleB2.radius - 20, v2, '#ff6b35');
      }

      frameCount++;
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const phase = useSimulationStore((s) => s.phase);

  return (
    <div className="relative w-full h-full min-h-[320px] rounded-xl overflow-hidden border border-cyan-900/30 shadow-[0_0_30px_rgba(0,229,255,0.05)]">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute top-3 left-4 flex items-center gap-2 text-xs font-mono text-cyan-400/60">
        <span className={`inline-block w-2 h-2 rounded-full ${phase === 'idle' ? 'bg-cyan-400 animate-pulse' : phase === 'colliding' ? 'bg-orange-400 animate-pulse' : phase === 'sticking' ? 'bg-orange-300 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
        {phase === 'idle' ? '就绪' : phase === 'approaching' ? '接近中' : phase === 'colliding' ? '碰撞中' : phase === 'sticking' ? '粘合运动中' : phase === 'separating' ? '分离中' : '完成'}
      </div>
    </div>
  );
}
