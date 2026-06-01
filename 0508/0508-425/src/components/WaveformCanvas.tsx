import React, { useRef, useEffect, useCallback } from 'react';
import type { HarmonicData } from '../types';

interface WaveformCanvasProps {
  waveformPoints: { x: number[]; y: number[] };
  harmonics: HarmonicData[];
  showIndividualHarmonics: boolean;
  animationPhase: number;
  idealValue: number;
}

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
  waveformPoints,
  harmonics,
  showIndividualHarmonics,
  animationPhase,
  idealValue,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const drawGrid = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    ctx.strokeStyle = 'rgba(0, 217, 255, 0.1)';
    ctx.lineWidth = 1;
    
    const gridSize = 40;
    
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }, []);

  const drawAxes = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number
  ) => {
    const centerY = height / 2;
    const yRange = yMax - yMin;
    
    ctx.strokeStyle = 'rgba(0, 217, 255, 0.5)';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(0, 217, 255, 0.7)';
    ctx.font = '12px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    
    const xLabels = [0, Math.PI, 2 * Math.PI, 3 * Math.PI, 4 * Math.PI];
    xLabels.forEach((xVal) => {
      const x = ((xVal - xMin) / (xMax - xMin)) * width;
      ctx.fillText(xVal === 0 ? '0' : xVal === Math.PI ? 'π' : `${(xVal / Math.PI).toFixed(0)}π`, x, centerY + 20);
    });
    
    ctx.textAlign = 'right';
    const yLabels = [-1.5, -1, -0.5, 0.5, 1, 1.5];
    yLabels.forEach((yVal) => {
      const y = centerY - (yVal / yRange) * height;
      ctx.fillText(yVal.toString(), width - 10, y + 4);
    });
  }, []);

  const drawHarmonic = useCallback((
    ctx: CanvasRenderingContext2D,
    harmonic: HarmonicData,
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    width: number,
    height: number,
    phase: number
  ) => {
    const centerY = height / 2;
    const yScale = height / (yMax - yMin) * 0.4;
    
    ctx.strokeStyle = harmonic.color;
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    
    const numPoints = 400;
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i <= numPoints; i++) {
      const xNorm = i / numPoints;
      const xVal = xMin + xNorm * (xMax - xMin);
      const yVal = harmonic.amplitude * Math.sin(harmonic.frequency * xVal + phase);
      points.push({
        x: xNorm * width,
        y: centerY - yVal * yScale
      });
    }
    
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length - 2; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.quadraticCurveTo(
      points[points.length - 2].x,
      points[points.length - 2].y,
      points[points.length - 1].x,
      points[points.length - 1].y
    );
    
    ctx.stroke();
    ctx.globalAlpha = 1;
  }, []);

  const drawCombinedWaveform = useCallback((
    ctx: CanvasRenderingContext2D,
    waveformPoints: { x: number[]; y: number[] },
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    width: number,
    height: number
  ) => {
    const centerY = height / 2;
    const yScale = height / (yMax - yMin) * 0.4;
    
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#00d9ff');
    gradient.addColorStop(0.5, '#ff0080');
    gradient.addColorStop(1, '#00d9ff');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#00d9ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    
    const points: { x: number; y: number }[] = waveformPoints.x.map((xVal, i) => {
      const xNorm = (xVal - xMin) / (xMax - xMin);
      return {
        x: xNorm * width,
        y: centerY - waveformPoints.y[i] * yScale
      };
    });
    
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length - 2; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.quadraticCurveTo(
      points[points.length - 2].x,
      points[points.length - 2].y,
      points[points.length - 1].x,
      points[points.length - 1].y
    );
    
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, []);

  const drawGibbsIndicator = useCallback((
    ctx: CanvasRenderingContext2D,
    waveformPoints: { x: number[]; y: number[] },
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    width: number,
    height: number,
    ideal: number
  ) => {
    const centerY = height / 2;
    const yScale = height / (yMax - yMin) * 0.4;
    
    let maxY = -Infinity;
    let maxIndex = 0;
    
    const startIdx = Math.floor(waveformPoints.x.length * 0.05);
    const endIdx = Math.floor(waveformPoints.x.length * 0.2);
    
    for (let i = startIdx; i < endIdx; i++) {
      if (waveformPoints.y[i] > maxY) {
        maxY = waveformPoints.y[i];
        maxIndex = i;
      }
    }
    
    const xNorm = (waveformPoints.x[maxIndex] - xMin) / (xMax - xMin);
    const x = xNorm * width;
    const y = centerY - maxY * yScale;
    const idealY = centerY - ideal * yScale;
    
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(x, idealY);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    
    const overshootPercent = ((maxY - ideal) / ideal) * 100;
    ctx.fillStyle = '#ffd700';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`过冲: ${overshootPercent.toFixed(2)}%`, x + 10, y - 10);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const dpr = Math.max(window.devicePixelRatio, 2);
    
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    const width = canvas.width;
    const height = canvas.height;
    const xMin = 0;
    const xMax = 4 * Math.PI;
    const yMin = -1.5;
    const yMax = 1.5;
    
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, width, height);
    
    drawGrid(ctx, width, height);
    drawAxes(ctx, width, height, xMin, xMax, yMin, yMax);
    
    if (showIndividualHarmonics) {
      harmonics.forEach((harmonic) => {
        drawHarmonic(ctx, harmonic, xMin, xMax, yMin, yMax, width, height, animationPhase);
      });
    }
    
    drawCombinedWaveform(ctx, waveformPoints, xMin, xMax, yMin, yMax, width, height);
    drawGibbsIndicator(ctx, waveformPoints, xMin, xMax, yMin, yMax, width, height, idealValue);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [waveformPoints, harmonics, showIndividualHarmonics, animationPhase, idealValue, drawGrid, drawAxes, drawHarmonic, drawCombinedWaveform, drawGibbsIndicator]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[300px] bg-[#0a0a1a] rounded-lg overflow-hidden border border-cyan-500/30"
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
