import { useRef, useEffect, useCallback } from "react";
import { useDiffraction } from "@/hooks/useDiffraction";
import { useSimulationStore } from "@/store/useSimulationStore";
import { wavelengthToColor } from "@/utils/diffraction";

interface Point {
  thetaDeg: number;
  intensity: number;
  envelope: number;
}

const PADDING = { top: 30, right: 30, bottom: 50, left: 60 };
const CURVE_COLOR = "#22d3ee";
const ENVELOPE_COLOR = "#f59e0b";
const AXIS_COLOR = "#475569";
const GRID_COLOR = "#1e293b";
const MISSING_MARKER_COLOR = "#f43f5e";

export default function IntensityChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverInfo = useRef<{ theta: number; intensity: number } | null>(null);
  const { curveData, rawCurveData, maxima } = useDiffraction();
  const { showEnvelope, showEnvelopeOnly, lambda } = useSimulationStore();

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

    if (curveData.length === 0) return;

    const thetaMin = curveData[0].thetaDeg;
    const thetaMax = curveData[curveData.length - 1].thetaDeg;
    const thetaRange = thetaMax - thetaMin;

    const toX = (theta: number) => PADDING.left + ((theta - thetaMin) / thetaRange) * plotW;
    const toY = (intensity: number) => PADDING.top + plotH - intensity * plotH;

    ctx.strokeStyle = GRID_COLOR;
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

    ctx.strokeStyle = AXIS_COLOR;
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
      const x = toX(t);
      ctx.fillText(`${t.toFixed(0)}°`, x, PADDING.top + plotH + 8);
    }

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= 5; i++) {
      const val = i / 5;
      const y = toY(val);
      ctx.fillText(val.toFixed(1), PADDING.left - 8, y);
    }

    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("θ (°)", PADDING.left + plotW / 2, h - 6);
    ctx.save();
    ctx.translate(14, PADDING.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("I / I₀", 0, 0);
    ctx.restore();

    if (showEnvelope && !showEnvelopeOnly && rawCurveData.length > 0) {
      drawCurve(ctx, rawCurveData, toX, toY, ENVELOPE_COLOR, 1.5, [6, 4]);
    }

    if (showEnvelopeOnly && rawCurveData.length > 0) {
      drawCurve(ctx, rawCurveData.map((p) => ({ ...p, intensity: p.envelope })), toX, toY, ENVELOPE_COLOR, 2);
    }

    if (!showEnvelopeOnly) {
      const curveColor = wavelengthToColor(lambda);
      drawCurve(ctx, curveData, toX, toY, curveColor, 1.8);
    }

    for (const m of maxima) {
      if (m.isMissing) {
        const x = toX(m.thetaDeg);
        const envVal = rawCurveData.length > 0
          ? getEnvelopeAtTheta(rawCurveData, m.thetaDeg)
          : 0;
        const y = toY(envVal);
        ctx.strokeStyle = MISSING_MARKER_COLOR;
        ctx.lineWidth = 2;
        const sz = 6;
        ctx.beginPath();
        ctx.moveTo(x - sz, y - sz);
        ctx.lineTo(x + sz, y + sz);
        ctx.moveTo(x + sz, y - sz);
        ctx.lineTo(x - sz, y + sz);
        ctx.stroke();
      } else {
        const x = toX(m.thetaDeg);
        const y = toY(m.order === 0 ? 1 : curveData[Math.min(
          Math.round(((m.thetaDeg - curveData[0].thetaDeg) / (curveData[curveData.length - 1].thetaDeg - curveData[0].thetaDeg)) * (curveData.length - 1)),
          curveData.length - 1
        )]?.intensity ?? 0);
        ctx.fillStyle = "#22d3ee";
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();

        if (Math.abs(m.order) <= 5) {
          ctx.fillStyle = "#94a3b8";
          ctx.font = "9px 'JetBrains Mono', monospace";
          ctx.textAlign = "center";
          ctx.fillText(`m=${m.order}`, x, y - 10);
        }
      }
    }

    if (hoverInfo.current) {
      const { theta, intensity } = hoverInfo.current;
      const x = toX(theta);
      const y = toY(intensity);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x, PADDING.top);
      ctx.lineTo(x, PADDING.top + plotH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(PADDING.left, y);
      ctx.lineTo(PADDING.left + plotW, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = "#475569";
      const labelX = Math.min(x + 10, PADDING.left + plotW - 120);
      const labelY = Math.max(y - 30, PADDING.top + 5);
      roundRect(ctx, labelX, labelY, 115, 25, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(`θ=${theta.toFixed(2)}°  I=${intensity.toFixed(4)}`, labelX + 5, labelY + 16);
    }

    drawLegend(ctx, w, h, showEnvelope, showEnvelopeOnly);
  }, [curveData, rawCurveData, maxima, showEnvelope, showEnvelopeOnly, lambda]);

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
      if (!canvas || !container || curveData.length === 0) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const plotW = rect.width - PADDING.left - PADDING.right;
      const thetaMin = curveData[0].thetaDeg;
      const thetaMax = curveData[curveData.length - 1].thetaDeg;
      const thetaRange = thetaMax - thetaMin;

      if (x < PADDING.left || x > PADDING.left + plotW) {
        hoverInfo.current = null;
        draw();
        return;
      }
      const theta = thetaMin + ((x - PADDING.left) / plotW) * thetaRange;
      const idx = Math.round(
        ((theta - thetaMin) / thetaRange) * (curveData.length - 1)
      );
      const clampedIdx = Math.max(0, Math.min(curveData.length - 1, idx));
      hoverInfo.current = {
        theta: curveData[clampedIdx].thetaDeg,
        intensity: curveData[clampedIdx].intensity,
      };
      draw();
    },
    [curveData, draw]
  );

  const handleMouseLeave = useCallback(() => {
    hoverInfo.current = null;
    draw();
  }, [draw]);

  return (
    <div ref={containerRef} className="h-full w-full min-h-[300px]">
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}

function drawCurve(
  ctx: CanvasRenderingContext2D,
  data: Point[],
  toX: (t: number) => number,
  toY: (i: number) => number,
  color: string,
  lineWidth: number,
  dash?: number[]
) {
  if (data.length === 0) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "round";
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(toX(data[0].thetaDeg), toY(data[0].intensity));
  for (let i = 1; i < data.length; i++) {
    ctx.lineTo(toX(data[i].thetaDeg), toY(data[i].intensity));
  }
  ctx.stroke();
  ctx.restore();
}

function getEnvelopeAtTheta(data: Point[], thetaDeg: number): number {
  if (data.length === 0) return 0;
  const thetaMin = data[0].thetaDeg;
  const thetaMax = data[data.length - 1].thetaDeg;
  const idx = Math.round(
    ((thetaDeg - thetaMin) / (thetaMax - thetaMin)) * (data.length - 1)
  );
  const clamped = Math.max(0, Math.min(data.length - 1, idx));
  return data[clamped].envelope;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
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

function drawLegend(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  showEnvelope: boolean,
  showEnvelopeOnly: boolean
) {
  const legendX = w - PADDING.right - 160;
  const legendY = PADDING.top + 8;
  ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 1;
  roundRect(ctx, legendX, legendY, 152, showEnvelope || showEnvelopeOnly ? 52 : 28, 4);
  ctx.fill();
  ctx.stroke();

  let yOff = legendY + 14;
  ctx.fillStyle = CURVE_COLOR;
  ctx.fillRect(legendX + 10, yOff - 4, 16, 3);
  ctx.fillStyle = "#cbd5e1";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("总光强分布", legendX + 32, yOff);

  if (showEnvelope || showEnvelopeOnly) {
    yOff += 20;
    ctx.strokeStyle = ENVELOPE_COLOR;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(legendX + 10, yOff - 2);
    ctx.lineTo(legendX + 26, yOff - 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("单缝衍射包络", legendX + 32, yOff);
  }
}
