import { useRef, useEffect, useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';

interface CradleBall {
  angle: number;
  angularVelocity: number;
  pivotX: number;
  pivotY: number;
  length: number;
  radius: number;
}

const BALL_COUNT = 5;
const GRAVITY = 980;
const DAMPING = 0.999;
const RESTITUTION = 0.99;

export default function NewtonCradle() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const ballsRef = useRef<CradleBall[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const initBalls = (w: number, h: number) => {
    const length = h * 0.55;
    const radius = Math.min(18, w / (BALL_COUNT * 3));
    const pivotY = h * 0.12;
    const spacing = radius * 2.05;
    const startX = w / 2 - (BALL_COUNT - 1) * spacing / 2;

    const balls: CradleBall[] = [];
    for (let i = 0; i < BALL_COUNT; i++) {
      balls.push({
        angle: i === 0 ? -Math.PI / 4 : 0,
        angularVelocity: 0,
        pivotX: startX + i * spacing,
        pivotY,
        length,
        radius,
      });
    }
    ballsRef.current = balls;
  };

  const start = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsRunning(true);
    initBalls(canvas.width, canvas.height);
  };

  const reset = () => {
    setIsRunning(false);
    ballsRef.current = [];
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

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

    const dt = 1 / 60;

    const animate = () => {
      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = '#0a0e1a';
      ctx.fillRect(0, 0, w, h);

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

      const frame = document.createElement('canvas');
      frame.width = w;
      frame.height = h;

      if (isRunning && ballsRef.current.length > 0) {
        const balls = ballsRef.current;

        for (let i = 0; i < BALL_COUNT; i++) {
          const b = balls[i];
          const angularAccel = -(GRAVITY / b.length) * Math.sin(b.angle);
          b.angularVelocity += angularAccel * dt;
          b.angularVelocity *= DAMPING;
          b.angle += b.angularVelocity * dt;
        }

        for (let iter = 0; iter < 3; iter++) {
          for (let i = 0; i < BALL_COUNT - 1; i++) {
            const b1 = balls[i];
            const b2 = balls[i + 1];
            const x1 = b1.pivotX + b1.length * Math.sin(b1.angle);
            const x2 = b2.pivotX + b2.length * Math.sin(b2.angle);
            const dist = x2 - x1;

            if (dist < b1.radius + b2.radius && dist > 0) {
              const nx = x2 - x1;
              const len = Math.abs(nx) || 1;
              const normalX = nx / len;

              const v1x = b1.angularVelocity * b1.length * Math.cos(b1.angle);
              const v2x = b2.angularVelocity * b2.length * Math.cos(b2.angle);
              const relVel = v1x - v2x;
              const velAlongNormal = relVel * normalX;

              if (velAlongNormal > 0) {
                const impulse = velAlongNormal * (1 + RESTITUTION) / 2;
                b1.angularVelocity -= impulse / b1.length;
                b2.angularVelocity += impulse / b2.length;
              }

              const overlap = b1.radius + b2.radius - dist;
              b1.angle -= overlap / (2 * b1.length);
              b2.angle += overlap / (2 * b2.length);
            }
          }
        }

        const pivotY = balls[0].pivotY;

        ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(balls[0].pivotX - 30, pivotY);
        ctx.lineTo(balls[BALL_COUNT - 1].pivotX + 30, pivotY);
        ctx.stroke();

        for (const b of balls) {
          const bx = b.pivotX + b.length * Math.sin(b.angle);
          const by = b.pivotY + b.length * Math.cos(b.angle);

          ctx.strokeStyle = 'rgba(160, 174, 192, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(b.pivotX, b.pivotY);
          ctx.lineTo(bx, by);
          ctx.stroke();

          const gradient = ctx.createRadialGradient(
            bx - b.radius * 0.3, by - b.radius * 0.3, b.radius * 0.1,
            bx, by, b.radius
          );
          gradient.addColorStop(0, '#ffffff');
          gradient.addColorStop(0.3, '#a0aec0');
          gradient.addColorStop(1, '#4a5568');

          ctx.beginPath();
          ctx.arc(bx, by, b.radius, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();

          ctx.shadowColor = '#a0aec0';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(bx, by, b.radius, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(160, 174, 192, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      } else if (!isRunning) {
        const length = h * 0.55;
        const radius = Math.min(18, w / (BALL_COUNT * 3));
        const pivotY = h * 0.12;
        const spacing = radius * 2.05;
        const startX = w / 2 - (BALL_COUNT - 1) * spacing / 2;

        ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX - 30, pivotY);
        ctx.lineTo(startX + (BALL_COUNT - 1) * spacing + 30, pivotY);
        ctx.stroke();

        for (let i = 0; i < BALL_COUNT; i++) {
          const px = startX + i * spacing;
          const by = pivotY + length;

          ctx.strokeStyle = 'rgba(160, 174, 192, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(px, pivotY);
          ctx.lineTo(px, by);
          ctx.stroke();

          const gradient = ctx.createRadialGradient(
            px - radius * 0.3, by - radius * 0.3, radius * 0.1,
            px, by, radius
          );
          gradient.addColorStop(0, '#ffffff');
          gradient.addColorStop(0.3, '#a0aec0');
          gradient.addColorStop(1, '#4a5568');

          ctx.beginPath();
          ctx.arc(px, by, radius, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animRef.current);
    };
  }, [isRunning]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="relative flex-1 min-h-[320px] rounded-xl overflow-hidden border border-cyan-900/30 shadow-[0_0_30px_rgba(0,229,255,0.05)]">
        <canvas ref={canvasRef} className="w-full h-full" />
        <div className="absolute top-3 left-4 text-xs font-mono text-cyan-400/60">
          牛顿摆（法拉第摆）简化模拟
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={start}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm
            bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-[0_0_20px_rgba(0,229,255,0.3)]
            hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] transition-all duration-300"
        >
          <Play size={16} /> 启动牛顿摆
        </button>
        <button
          onClick={reset}
          className="px-4 py-2.5 rounded-xl text-sm font-medium border border-zinc-600 text-zinc-300
            hover:border-zinc-400 hover:text-white transition-all duration-200"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}
