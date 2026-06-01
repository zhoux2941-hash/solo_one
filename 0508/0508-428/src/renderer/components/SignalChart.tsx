import React, { useRef, useEffect, useMemo } from 'react';
import { CanFrame, CanIdProfile, SignalIdentification, isDigitalSignal, formatCanId, SIGNAL_TYPE_LABELS } from '../types';

interface SignalChartProps {
  frames: CanFrame[];
  selectedCanIds: number[];
  profiles: CanIdProfile[];
  identifications: SignalIdentification[];
}

const CHART_COLORS = [
  '#58a6ff', '#3fb950', '#d29922', '#f85149',
  '#bc8cff', '#db6d28', '#39d353', '#f778ba',
];

interface DataPoint {
  x: number;
  y: number;
}

export const SignalChart: React.FC<SignalChartProps> = ({
  frames,
  selectedCanIds,
  profiles,
  identifications,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollOffsetRef = useRef(0);
  const visibleWindowUs = 10_000_000;

  const profileMap = useMemo(() => {
    const map = new Map<number, CanIdProfile>();
    profiles.forEach(p => map.set(p.can_id, p));
    return map;
  }, [profiles]);

  const idMap = useMemo(() => {
    const map = new Map<number, SignalIdentification>();
    identifications.forEach(id => map.set(id.can_id, id));
    return map;
  }, [identifications]);

  const seriesData = useMemo(() => {
    const data = new Map<number, DataPoint[]>();
    for (const canId of selectedCanIds) {
      const points: DataPoint[] = [];
      for (const frame of frames) {
        if (frame.can_id === canId) {
          const raw16 = ((frame.data[1] || 0) << 8) | frame.data[0];
          points.push({ x: frame.timestamp_us, y: raw16 });
        }
      }
      data.set(canId, points);
    }
    return data;
  }, [frames, selectedCanIds]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = { top: 30, right: 20, bottom: 30, left: 70 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);

    if (selectedCanIds.length === 0) {
      ctx.fillStyle = '#6e7681';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Select CAN IDs from the sidebar to display signal curves', w / 2, h / 2);
      return;
    }

    const allPoints = Array.from(seriesData.values()).flat();
    if (allPoints.length === 0) {
      ctx.fillStyle = '#6e7681';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Waiting for data...', w / 2, h / 2);
      return;
    }

    const maxTime = Math.max(...allPoints.map(p => p.x));
    const minTime = Math.max(0, maxTime - visibleWindowUs);

    const rowHeight = chartH / selectedCanIds.length;

    ctx.strokeStyle = '#21262d';
    ctx.lineWidth = 1;
    for (let i = 0; i <= selectedCanIds.length; i++) {
      const y = padding.top + i * rowHeight;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartW, y);
      ctx.stroke();
    }

    const timeTicks = 5;
    for (let i = 0; i <= timeTicks; i++) {
      const t = minTime + (visibleWindowUs * i) / timeTicks;
      const x = padding.left + (chartW * i) / timeTicks;
      ctx.strokeStyle = '#21262d';
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + chartH);
      ctx.stroke();

      ctx.fillStyle = '#6e7681';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      const timeS = ((t - minTime) / 1_000_000).toFixed(1);
      ctx.fillText(`${timeS}s`, x, padding.top + chartH + 15);
    }

    selectedCanIds.forEach((canId, idx) => {
      const points = seriesData.get(canId) || [];
      const visiblePoints = points.filter(p => p.x >= minTime && p.x <= maxTime);
      if (visiblePoints.length < 2) return;

      const values = visiblePoints.map(p => p.y);
      const minVal = Math.min(...values);
      const maxVal = Math.max(...values);
      const valRange = maxVal - minVal || 1;

      const rowTop = padding.top + idx * rowHeight;
      const color = CHART_COLORS[idx % CHART_COLORS.length];

      ctx.fillStyle = color;
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      const ident = idMap.get(canId);
      const label = ident ? SIGNAL_TYPE_LABELS[ident.signal_type] : formatCanId(canId);
      ctx.fillText(`${formatCanId(canId)} - ${label}`, padding.left + 4, rowTop + 14);

      const isDigital = ident ? isDigitalSignal(ident.signal_type) : false;

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      const plotTop = rowTop + 20;
      const plotHeight = rowHeight - 30;

      visiblePoints.forEach((point, i) => {
        const x = padding.left + ((point.x - minTime) / visibleWindowUs) * chartW;
        const y = plotTop + plotHeight - ((point.y - minVal) / valRange) * plotHeight;

        if (isDigital) {
          ctx.lineTo(x, y);
          if (i < visiblePoints.length - 1) {
            const nextX = padding.left + ((visiblePoints[i + 1].x - minTime) / visibleWindowUs) * chartW;
            ctx.lineTo(nextX, y);
          }
        } else {
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      ctx.fillStyle = '#6e7681';
      ctx.font = '9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${maxVal.toFixed(0)}`, padding.left - 4, plotTop + 8);
      ctx.fillText(`${minVal.toFixed(0)}`, padding.left - 4, plotTop + plotHeight);
    });

  }, [seriesData, selectedCanIds, profileMap, idMap, visibleWindowUs]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="chart-container" ref={containerRef}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};
