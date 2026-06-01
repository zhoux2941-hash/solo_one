import { useEffect, useRef, useCallback } from 'react';
import { useCircuitStore } from '@/store/circuitStore';
import { useAnimatedTransition } from '@/hooks/useAnimatedTransition';
import { calculateAll, formatTime } from '@/utils/calculations';
import { easeOutQuart } from '@/utils/easing';
import type { CircuitParams } from '@/types';

const PADDING = { top: 40, right: 40, bottom: 60, left: 70 };

export default function RCCurve() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { params } = useCircuitStore();

  const displayParams = useAnimatedTransition<CircuitParams>(params, {
    duration: 400,
    easing: easeOutQuart,
  });

  const draw = useCallback(
    (drawParams: CircuitParams) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.scale(dpr, dpr);

      const result = calculateAll(drawParams);
      const { tau, chargeVoltages, dischargeVoltages, timePoints, keyPoints } = result;
      const v0 = drawParams.voltage;
      const maxTime = timePoints[timePoints.length - 1];
      const maxVoltage = v0 * 1.15;

      const plotLeft = PADDING.left;
      const plotTop = PADDING.top;
      const plotWidth = width - PADDING.left - PADDING.right;
      const plotHeight = height - PADDING.top - PADDING.bottom;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#0a192f';
      ctx.fillRect(0, 0, width, height);

      const gridLinesX = 10;
      const gridLinesY = 8;

      ctx.strokeStyle = 'rgba(100, 255, 218, 0.05)';
      ctx.lineWidth = 1;

      for (let i = 0; i <= gridLinesX; i++) {
        const x = plotLeft + (i / gridLinesX) * plotWidth;
        ctx.beginPath();
        ctx.moveTo(x, plotTop);
        ctx.lineTo(x, plotTop + plotHeight);
        ctx.stroke();
      }

      for (let i = 0; i <= gridLinesY; i++) {
        const y = plotTop + (i / gridLinesY) * plotHeight;
        ctx.beginPath();
        ctx.moveTo(plotLeft, y);
        ctx.lineTo(plotLeft + plotWidth, y);
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(100, 255, 218, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(plotLeft, plotTop + plotHeight);
      ctx.lineTo(plotLeft + plotWidth, plotTop + plotHeight);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(plotLeft, plotTop);
      ctx.lineTo(plotLeft, plotTop + plotHeight);
      ctx.stroke();

      ctx.fillStyle = '#8892b0';
      ctx.font = '11px "Space Mono", monospace';
      ctx.textAlign = 'center';

      for (let i = 0; i <= gridLinesX; i++) {
        const x = plotLeft + (i / gridLinesX) * plotWidth;
        const t = (i / gridLinesX) * maxTime;
        ctx.fillText(formatTime(t), x, plotTop + plotHeight + 20);
      }

      ctx.textAlign = 'right';
      for (let i = 0; i <= gridLinesY; i++) {
        const y = plotTop + plotHeight - (i / gridLinesY) * plotHeight;
        const v = (i / gridLinesY) * maxVoltage;
        ctx.fillText(v.toFixed(1) + 'V', plotLeft - 10, y + 4);
      }

      ctx.save();
      ctx.translate(15, plotTop + plotHeight / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#8892b0';
      ctx.font = '12px "Space Mono", monospace';
      ctx.fillText('电压 (V)', 0, 0);
      ctx.restore();

      ctx.fillStyle = '#8892b0';
      ctx.font = '12px "Space Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('时间', plotLeft + plotWidth / 2, plotTop + plotHeight + 48);

      const toX = (t: number) => plotLeft + (t / maxTime) * plotWidth;
      const toY = (v: number) => plotTop + plotHeight - (v / maxVoltage) * plotHeight;

      const tauMarkers = [
        { mult: 1, label: 'τ', data: keyPoints.tau1 },
        { mult: 2, label: '2τ', data: keyPoints.tau2 },
        { mult: 3, label: '3τ', data: keyPoints.tau3 },
      ];

      tauMarkers.forEach(({ label, data }) => {
        if (data.time <= maxTime) {
          const x = toX(data.time);
          ctx.strokeStyle = 'rgba(100, 255, 218, 0.12)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(x, plotTop);
          ctx.lineTo(x, plotTop + plotHeight);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = 'rgba(100, 255, 218, 0.6)';
          ctx.font = '10px "Space Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(label, x, plotTop - 8);
        }
      });

      const yAtV0 = toY(v0);
      ctx.strokeStyle = 'rgba(100, 255, 218, 0.12)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(plotLeft, yAtV0);
      ctx.lineTo(plotLeft + plotWidth, yAtV0);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(100, 255, 218, 0.5)';
      ctx.font = '10px "Space Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('V₀', plotLeft + plotWidth + 4, yAtV0 + 4);

      const drawCurve = (
        voltages: number[],
        color: string,
        glowColor: string,
      ) => {
        ctx.beginPath();
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 6;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        for (let i = 0; i < voltages.length; i++) {
          const x = toX(timePoints[i]);
          const y = toY(voltages[i]);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        for (let i = 0; i < voltages.length; i++) {
          const x = toX(timePoints[i]);
          const y = toY(voltages[i]);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };

      drawCurve(chargeVoltages, '#ff9f43', 'rgba(255, 159, 67, 0.15)');
      drawCurve(dischargeVoltages, '#a855f7', 'rgba(168, 85, 247, 0.15)');

      tauMarkers.forEach(({ data }) => {
        if (data.time <= maxTime) {
          const x = toX(data.time);

          ctx.beginPath();
          ctx.arc(x, toY(data.chargeV), 5, 0, Math.PI * 2);
          ctx.fillStyle = '#ff9f43';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 159, 67, 0.3)';
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(x, toY(data.dischargeV), 5, 0, Math.PI * 2);
          ctx.fillStyle = '#a855f7';
          ctx.fill();
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      });
    },
    [],
  );

  useEffect(() => {
    draw(displayParams);
  }, [displayParams, draw]);

  useEffect(() => {
    const handleResize = () => draw(displayParams);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [displayParams, draw]);

  return (
    <div className="animate-slide-in-right">
      <div className="glass-card p-4 glass-card-hover transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-glow-pulse" />
            瞬态响应曲线
          </h2>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded bg-charge" />
              <span className="text-charge">充电</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded bg-discharge" />
              <span className="text-discharge">放电</span>
            </div>
          </div>
        </div>
        <div ref={containerRef} className="w-full" style={{ height: '420px' }}>
          <canvas ref={canvasRef} className="w-full h-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
