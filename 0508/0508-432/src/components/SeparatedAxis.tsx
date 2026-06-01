import { useRef, useEffect } from 'react';
import { useSimulationStore } from '@/store/simulationStore';
import { calculateCollision, MATERIAL_PRESETS } from '@/utils/physics';

interface TimePoint {
  t: number;
  x1: number;
  x2: number;
  v1: number;
  v2: number;
}

export default function SeparatedAxis() {
  const posCanvasRef = useRef<HTMLCanvasElement>(null);
  const velCanvasRef = useRef<HTMLCanvasElement>(null);
  const { v1, v2, m1, m2, restitution, material1, material2 } = useSimulationStore();

  useEffect(() => {
    const result = calculateCollision(m1, m2, v1, v2, restitution);
    const data: TimePoint[] = [];
    const dt = 0.016;
    const totalTime = 3;
    const pixelsPerMeter = 30;

    let x1 = 0;
    let x2 = 8;
    let cv1 = v1;
    let cv2 = v2;
    let collided = false;

    for (let t = 0; t < totalTime; t += dt) {
      data.push({ t, x1, x2, v1: cv1, v2: cv2 });

      if (!collided && Math.abs(x2 - x1) < 0.3) {
        collided = true;
        cv1 = result.v1After;
        cv2 = result.v2After;
      }

      x1 += cv1 * dt;
      x2 += cv2 * dt;
    }

    drawChart(posCanvasRef.current, data, 'x', pixelsPerMeter, material1, material2);
    drawChart(velCanvasRef.current, data, 'v', 1, material1, material2);
  }, [v1, v2, m1, m2, restitution, material1, material2]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex-1 min-h-[200px] rounded-xl overflow-hidden border border-cyan-900/30 bg-[#0a0e1a] relative">
        <canvas ref={posCanvasRef} className="w-full h-full" />
        <div className="absolute top-2 left-3 text-[10px] font-mono text-cyan-400/60">位置 - 时间 (x-t)</div>
      </div>
      <div className="flex-1 min-h-[200px] rounded-xl overflow-hidden border border-cyan-900/30 bg-[#0a0e1a] relative">
        <canvas ref={velCanvasRef} className="w-full h-full" />
        <div className="absolute top-2 left-3 text-[10px] font-mono text-cyan-400/60">速度 - 时间 (v-t)</div>
      </div>
    </div>
  );
}

function drawChart(
  canvas: HTMLCanvasElement | null,
  data: TimePoint[],
  mode: 'x' | 'v',
  scale: number,
  material1: string,
  material2: string
) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const rect = canvas.parentElement?.getBoundingClientRect();
  if (!rect) return;
  canvas.width = rect.width;
  canvas.height = rect.height;

  const w = canvas.width;
  const h = canvas.height;
  const pad = { top: 30, right: 20, bottom: 30, left: 60 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  ctx.fillStyle = '#0a0e1a';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = pad.top + (plotH * i) / 5;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();
  }
  for (let i = 0; i <= 5; i++) {
    const x = pad.left + (plotW * i) / 5;
    ctx.beginPath();
    ctx.moveTo(x, pad.top);
    ctx.lineTo(x, h - pad.bottom);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(0, 229, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top);
  ctx.lineTo(pad.left, h - pad.bottom);
  ctx.lineTo(w - pad.right, h - pad.bottom);
  ctx.stroke();

  if (data.length < 2) return;

  const tMin = data[0].t;
  const tMax = data[data.length - 1].t;
  const tRange = tMax - tMin || 1;

  let yMin: number, yMax: number;
  if (mode === 'x') {
    const allX = data.flatMap((d) => [d.x1 * scale, d.x2 * scale]);
    yMin = Math.min(...allX) - 1;
    yMax = Math.max(...allX) + 1;
  } else {
    const allV = data.flatMap((d) => [d.v1, d.v2]);
    yMin = Math.min(...allV) - 1;
    yMax = Math.max(...allV) + 1;
  }
  if (yMin === yMax) { yMin -= 1; yMax += 1; }
  const yRange = yMax - yMin;

  const mapX = (t: number) => pad.left + ((t - tMin) / tRange) * plotW;
  const mapY = (v: number) => pad.top + plotH - ((v - yMin) / yRange) * plotH;

  const c1 = (MATERIAL_PRESETS as Record<string, { color: string }>)[material1]?.color || '#00e5ff';
  const c2 = (MATERIAL_PRESETS as Record<string, { color: string }>)[material2]?.color || '#ff6b35';

  const drawLine = (getValue: (d: TimePoint) => number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = mapX(data[i].t);
      const y = mapY(getValue(data[i]));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  if (mode === 'x') {
    drawLine((d) => d.x1 * scale, c1);
    drawLine((d) => d.x2 * scale, c2);
  } else {
    drawLine((d) => d.v1, c1);
    drawLine((d) => d.v2, c2);
  }

  ctx.fillStyle = 'rgba(0, 229, 255, 0.4)';
  ctx.font = "10px 'JetBrains Mono', monospace";
  ctx.textAlign = 'right';
  for (let i = 0; i <= 5; i++) {
    const val = yMin + (yRange * i) / 5;
    const y = mapY(val);
    ctx.fillText(val.toFixed(1), pad.left - 8, y + 3);
  }

  ctx.textAlign = 'center';
  for (let i = 0; i <= 5; i++) {
    const val = tMin + (tRange * i) / 5;
    const x = mapX(val);
    ctx.fillText(val.toFixed(1) + 's', x, h - pad.bottom + 14);
  }

  ctx.font = "bold 11px 'Space Grotesk', sans-serif";
  ctx.textAlign = 'left';
  ctx.fillStyle = c1;
  ctx.fillText(mode === 'x' ? '球1 位置' : '球1 速度', pad.left + 10, pad.top + 14);
  ctx.fillStyle = c2;
  ctx.fillText(mode === 'x' ? '球2 位置' : '球2 速度', pad.left + 100, pad.top + 14);
}
