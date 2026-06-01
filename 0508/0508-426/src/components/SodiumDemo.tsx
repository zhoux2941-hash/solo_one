import { useRef, useEffect, useCallback, useMemo } from "react";
import {
  computeIntensityCurve,
  principalMaxima,
  SODIUM_LINE_1,
  SODIUM_LINE_2,
  type DiffractionParams,
} from "@/utils/diffraction";
import { useSimulationStore } from "@/store/useSimulationStore";

const PADDING = { top: 30, right: 30, bottom: 50, left: 60 };
const COLOR_1 = "#3b82f6";
const COLOR_1_FILL = "rgba(59, 130, 246, 0.12)";
const COLOR_2 = "#ef4444";
const COLOR_2_FILL = "rgba(239, 68, 68, 0.12)";

export default function SodiumDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverInfo = useRef<{ theta: number; i1: number; i2: number } | null>(null);
  const { d, a, N } = useSimulationStore();

  const params1: DiffractionParams = useMemo(() => ({ d, a, N, lambda: SODIUM_LINE_1 }), [d, a, N]);
  const params2: DiffractionParams = useMemo(() => ({ d, a, N, lambda: SODIUM_LINE_2 }), [d, a, N]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const plotW = w - PADDING.left - PADDING.right;
    const plotH = h - PADDING.top - PADDING.bottom;

    const curve1 = computeIntensityCurve(params1, 2000);
    const curve2 = computeIntensityCurve(params2, 2000);
    if (curve1.length === 0) return;

    const thetaMin = curve1[0].thetaDeg;
    const thetaMax = curve1[curve1.length - 1].thetaDeg;
    const thetaRange = thetaMax - thetaMin;

    const toX = (theta: number) => PADDING.left + ((theta - thetaMin) / thetaRange) * plotW;
    const toY = (intensity: number) => PADDING.top + plotH - intensity * plotH;

    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 10; i++) {
      const y = PADDING.top + (i / 10) * plotH;
      ctx.beginPath();
      ctx.moveTo(PADDING.left, y);
      ctx.lineTo(PADDING.left + plotW, y);
      ctx.stroke();
    }

    const thetaStep = thetaRange > 30 ? 10 : thetaRange > 10 ? 5 : 2;
    const firstTick = Math.ceil(thetaMin / thetaStep) * thetaStep;
    for (let t = firstTick; t <= thetaMax; t += thetaStep) {
      const x = toX(t);
      ctx.beginPath();
      ctx.moveTo(x, PADDING.top);
      ctx.lineTo(x, PADDING.top + plotH);
      ctx.stroke();
    }

    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PADDING.left, PADDING.top);
    ctx.lineTo(PADDING.left, PADDING.top + plotH);
    ctx.lineTo(PADDING.left + plotW, PADDING.top + plotH);
    ctx.stroke();

    ctx.fillStyle = "#64748b";
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let t = firstTick; t <= thetaMax; t += thetaStep) {
      ctx.fillText(`${t.toFixed(0)}°`, toX(t), PADDING.top + plotH + 8);
    }

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= 5; i++) {
      ctx.fillText((i / 5).toFixed(1), PADDING.left - 8, toY(i / 5));
    }

    drawCurveWithFill(ctx, curve1, toX, toY, COLOR_1, COLOR_1_FILL, 2);
    drawCurveWithFill(ctx, curve2, toX, toY, COLOR_2, COLOR_2_FILL, 2);

    const maxima1 = principalMaxima(params1);
    for (const m of maxima1.filter((m) => m.order > 0)) {
      const x = toX(m.thetaDeg);
      ctx.fillStyle = "#64748b";
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(`m=${m.order}`, x, PADDING.top + plotH + 22);
    }

    if (hoverInfo.current) {
      const { theta, i1, i2 } = hoverInfo.current;
      const x = toX(theta);
      const y1 = toY(i1);
      const y2 = toY(i2);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x, PADDING.top);
      ctx.lineTo(x, PADDING.top + plotH);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = COLOR_1;
      ctx.beginPath();
      ctx.arc(x, y1, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = COLOR_2;
      ctx.beginPath();
      ctx.arc(x, y2, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1;
      ctx.stroke();

      const labelX = Math.min(x + 12, PADDING.left + plotW - 170);
      const labelY = Math.max(Math.min(y1, y2) - 30, PADDING.top + 5);
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.strokeStyle = "#475569";
      roundRect(ctx, labelX, labelY, 165, 38, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = COLOR_1;
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(`589.0nm: θ=${theta.toFixed(2)}° I=${i1.toFixed(4)}`, labelX + 5, labelY + 14);
      ctx.fillStyle = COLOR_2;
      ctx.fillText(`589.6nm: I=${i2.toFixed(4)}`, labelX + 5, labelY + 28);
    }

    drawSodiumLegend(ctx, w);
  }, [params1, params2]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const handleResize = () => draw();
    const ro = new ResizeObserver(handleResize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [draw]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const plotW = rect.width - PADDING.left - PADDING.right;
      const curve1 = computeIntensityCurve(params1, 2000);
      if (curve1.length === 0) return;
      const thetaMin = curve1[0].thetaDeg;
      const thetaMax = curve1[curve1.length - 1].thetaDeg;
      const thetaRange = thetaMax - thetaMin;
      if (x < PADDING.left || x > PADDING.left + plotW) {
        hoverInfo.current = null;
        draw();
        return;
      }
      const theta = thetaMin + ((x - PADDING.left) / plotW) * thetaRange;
      const idx = Math.round(((theta - thetaMin) / thetaRange) * (curve1.length - 1));
      const clamped = Math.max(0, Math.min(curve1.length - 1, idx));
      const curve2 = computeIntensityCurve(params2, 2000);
      hoverInfo.current = {
        theta: curve1[clamped].thetaDeg,
        i1: curve1[clamped].intensity,
        i2: curve2[clamped]?.intensity ?? 0,
      };
      draw();
    },
    [params1, params2, draw]
  );

  const handleMouseLeave = useCallback(() => {
    hoverInfo.current = null;
    draw();
  }, [draw]);

  return (
    <div className="flex h-full w-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-200">钠光双线分辨演示</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            瑞利判据：两波长主极大刚好可分辨时的最小角间距
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1 w-5 rounded-full" style={{ backgroundColor: COLOR_1 }} />
            <span className="text-blue-300">λ₁ = 589.0 nm</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1 w-5 rounded-full" style={{ backgroundColor: COLOR_2 }} />
            <span className="text-red-300">λ₂ = 589.6 nm</span>
          </span>
        </div>
      </div>
      <div ref={containerRef} className="min-h-[350px] flex-1">
        <canvas
          ref={canvasRef}
          className="h-full w-full cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <SodiumInfoCard label="所需分辨本领" value={`λ/Δλ = ${Math.round(SODIUM_LINE_1 / 0.6)}`} />
        <SodiumInfoCard label="一级分辨本领" value={`R₁ = 1×${params1.N} = ${params1.N}`} />
        <SodiumInfoCard label="最小可分辨级次" value={`m ≥ ${computeMinOrder(params1)}`} />
      </div>
    </div>
  );
}

function SodiumInfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</div>
      <div className="mt-1 font-mono text-sm text-cyan-400">{value}</div>
    </div>
  );
}

function computeMinOrder(params: DiffractionParams): string {
  const R = params.lambda / 0.6;
  return Math.ceil(R / params.N).toString();
}

function drawCurveWithFill(
  ctx: CanvasRenderingContext2D,
  data: { thetaDeg: number; intensity: number }[],
  toX: (t: number) => number,
  toY: (i: number) => number,
  strokeColor: string,
  fillColor: string,
  lineWidth: number
) {
  if (data.length === 0) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(toX(data[0].thetaDeg), toY(data[0].intensity));
  for (let i = 1; i < data.length; i++) {
    ctx.lineTo(toX(data[i].thetaDeg), toY(data[i].intensity));
  }
  ctx.lineTo(toX(data[data.length - 1].thetaDeg), toY(0));
  ctx.lineTo(toX(data[0].thetaDeg), toY(0));
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(toX(data[0].thetaDeg), toY(data[0].intensity));
  for (let i = 1; i < data.length; i++) {
    ctx.lineTo(toX(data[i].thetaDeg), toY(data[i].intensity));
  }
  ctx.stroke();
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawSodiumLegend(ctx: CanvasRenderingContext2D, w: number) {
  const lx = w - PADDING.right - 155;
  const ly = PADDING.top + 8;
  ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 1;
  roundRect(ctx, lx, ly, 147, 52, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = COLOR_1;
  ctx.fillRect(lx + 10, ly + 14, 16, 3);
  ctx.fillStyle = "#cbd5e1";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("589.0 nm", lx + 32, ly + 18);

  ctx.fillStyle = COLOR_2;
  ctx.fillRect(lx + 10, ly + 34, 16, 3);
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText("589.6 nm", lx + 32, ly + 38);
}
