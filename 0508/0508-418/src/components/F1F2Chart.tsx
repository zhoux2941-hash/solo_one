import { useEffect, useRef, useState, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { VOWELS, CHART_BOUNDS } from '@/data/vowels';
import { useAppStore, HistoryPoint } from '@/store/useAppStore';
import { FormantData } from '@/hooks/useAudioAnalysis';
import {
  f1ToCanvasY,
  f2ToCanvasX,
  lerp,
} from '@/utils/acoustics';
import { VowelData, Gender } from '@/types';

const PADDING = {
  top: 50,
  right: 50,
  bottom: 60,
  left: 70,
};

const VOWEL_COLORS: Record<string, { primary: string; glow: string; light: string }> = {
  i: { primary: '#38bdf8', glow: 'rgba(56, 189, 248, 0.4)', light: '#0ea5e9' },
  e: { primary: '#a78bfa', glow: 'rgba(167, 139, 250, 0.4)', light: '#8b5cf6' },
  a: { primary: '#f472b6', glow: 'rgba(244, 114, 182, 0.4)', light: '#ec4899' },
  o: { primary: '#fb923c', glow: 'rgba(251, 146, 60, 0.4)', light: '#f97316' },
  u: { primary: '#4ade80', glow: 'rgba(74, 222, 128, 0.4)', light: '#22c55e' },
};

const REAL_TIME_COLOR = {
  primary: '#10b981',
  glow: 'rgba(16, 185, 129, 0.5)',
  light: '#059669',
};

interface AnimatedPoint {
  vowel: VowelData;
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
  isSelected: boolean;
  scale: number;
  targetScale: number;
}

interface HoveredVowel {
  vowel: VowelData;
  x: number;
  y: number;
  f1: number;
  f2: number;
}

interface F1F2ChartProps {
  realTimeFormant: FormantData | null;
  formantHistory: FormantData[];
  isAudioActive: boolean;
}

export const F1F2Chart = ({
  realTimeFormant,
  formantHistory,
  isAudioActive,
}: F1F2ChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const pointsRef = useRef<AnimatedPoint[]>([]);
  const lastSelectedVowelRef = useRef<string>('i');
  const realTimePointRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const [hoveredVowel, setHoveredVowel] = useState<HoveredVowel | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 500 });

  const {
    selectedVowelId,
    getF1,
    getF2,
    overlayMode,
    historyPoints,
    addHistoryPoint,
    clearHistory,
    gender,
  } = useAppStore();

  useEffect(() => {
    if (overlayMode && lastSelectedVowelRef.current !== selectedVowelId) {
      const vowel = VOWELS.find((v) => v.id === selectedVowelId);
      if (vowel) {
        const f1 = getF1(vowel);
        const f2 = getF2(vowel);
        addHistoryPoint({
          vowelId: vowel.id,
          ipa: vowel.ipa,
          exampleWord: vowel.exampleWord,
          f1,
          f2,
          gender: gender as Gender,
          timestamp: Date.now(),
        });
      }
      lastSelectedVowelRef.current = selectedVowelId;
    }
  }, [selectedVowelId, overlayMode, getF1, getF2, addHistoryPoint, gender]);

  useEffect(() => {
    if (realTimeFormant && isAudioActive) {
      const { width, height } = dimensions;
      const targetX = f2ToCanvasX(realTimeFormant.f2, width, PADDING.left, PADDING.right);
      const targetY = f1ToCanvasY(realTimeFormant.f1, height, PADDING.top, PADDING.bottom);
      realTimePointRef.current.targetX = targetX;
      realTimePointRef.current.targetY = targetY;
    }
  }, [realTimeFormant, isAudioActive, dimensions]);

  const initPoints = useCallback(() => {
    const { width, height } = dimensions;
    pointsRef.current = VOWELS.map((vowel) => {
      const f1 = getF1(vowel);
      const f2 = getF2(vowel);
      const x = f2ToCanvasX(f2, width, PADDING.left, PADDING.right);
      const y = f1ToCanvasY(f1, height, PADDING.top, PADDING.bottom);
      const isSelected = vowel.id === selectedVowelId;
      return {
        vowel,
        currentX: x,
        currentY: y,
        targetX: x,
        targetY: y,
        isSelected,
        scale: isSelected ? 1 : 0.85,
        targetScale: isSelected ? 1 : 0.85,
      };
    });
  }, [dimensions, selectedVowelId, getF1, getF2]);

  const updateTargetPositions = useCallback(() => {
    const { width, height } = dimensions;
    pointsRef.current = pointsRef.current.map((point) => {
      const f1 = getF1(point.vowel);
      const f2 = getF2(point.vowel);
      const targetX = f2ToCanvasX(f2, width, PADDING.left, PADDING.right);
      const targetY = f1ToCanvasY(f1, height, PADDING.top, PADDING.bottom);
      const isSelected = point.vowel.id === selectedVowelId;
      return {
        ...point,
        targetX,
        targetY,
        isSelected,
        targetScale: isSelected ? 1 : 0.85,
      };
    });
  }, [dimensions, selectedVowelId, getF1, getF2]);

  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const { f1Min, f1Max, f2Min, f2Max } = CHART_BOUNDS;

      ctx.strokeStyle = 'rgba(100, 116, 139, 0.15)';
      ctx.lineWidth = 1;

      const f1Step = 100;
      for (let f1 = f1Min; f1 <= f1Max; f1 += f1Step) {
        const y = f1ToCanvasY(f1, height, PADDING.top, PADDING.bottom);
        ctx.beginPath();
        ctx.moveTo(PADDING.left, y);
        ctx.lineTo(width - PADDING.right, y);
        ctx.stroke();
      }

      const f2Step = 200;
      for (let f2 = f2Min; f2 <= f2Max; f2 += f2Step) {
        const x = f2ToCanvasX(f2, width, PADDING.left, PADDING.right);
        ctx.beginPath();
        ctx.moveTo(x, PADDING.top);
        ctx.lineTo(x, height - PADDING.bottom);
        ctx.stroke();
      }
    },
    []
  );

  const drawAxes = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const { f1Min, f1Max, f2Min, f2Max } = CHART_BOUNDS;

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(PADDING.left, PADDING.top);
      ctx.lineTo(PADDING.left, height - PADDING.bottom);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(PADDING.left, height - PADDING.bottom);
      ctx.lineTo(width - PADDING.right, height - PADDING.bottom);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      const f1Step = 100;
      for (let f1 = f1Min; f1 <= f1Max; f1 += f1Step) {
        const y = f1ToCanvasY(f1, height, PADDING.top, PADDING.bottom);
        ctx.fillText(`${f1}`, PADDING.left - 12, y);

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(PADDING.left - 5, y);
        ctx.lineTo(PADDING.left, y);
        ctx.stroke();
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const f2Step = 200;
      for (let f2 = f2Min; f2 <= f2Max; f2 += f2Step) {
        const x = f2ToCanvasX(f2, width, PADDING.left, PADDING.right);
        ctx.fillText(`${f2}`, x, height - PADDING.bottom + 12);

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, height - PADDING.bottom);
        ctx.lineTo(x, height - PADDING.bottom + 5);
        ctx.stroke();
      }

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.textAlign = 'center';

      ctx.save();
      ctx.translate(18, height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('F1 (Hz) — 舌位高低', 0, 0);
      ctx.restore();

      ctx.fillText('F2 (Hz) — 舌位前后', width / 2, height - 18);

      ctx.fillStyle = '#64748b';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('← 高', PADDING.left - 5, PADDING.top - 20);
      ctx.fillText('低 ↓', PADDING.left - 5, height - PADDING.bottom + 35);
      ctx.textAlign = 'right';
      ctx.fillText('前 →', width - PADDING.right + 5, height - PADDING.bottom + 35);
      ctx.fillText('← 后', PADDING.left - 5, height - PADDING.bottom + 35);
    },
    []
  );

  const drawVowelQuadrilateral = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const vowelOrder = ['i', 'e', 'a', 'o', 'u', 'i'];
      const points = vowelOrder
        .map((id) => VOWELS.find((v) => v.id === id))
        .filter((v): v is VowelData => v !== undefined);

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);

      points.forEach((vowel, index) => {
        const f1 = getF1(vowel);
        const f2 = getF2(vowel);
        const x = f2ToCanvasX(f2, width, PADDING.left, PADDING.right);
        const y = f1ToCanvasY(f1, height, PADDING.top, PADDING.bottom);

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(139, 92, 246, 0.08)';
      ctx.beginPath();
      const fillPoints = points.slice(0, 5);
      fillPoints.forEach((vowel, index) => {
        const f1 = getF1(vowel);
        const f2 = getF2(vowel);
        const x = f2ToCanvasX(f2, width, PADDING.left, PADDING.right);
        const y = f1ToCanvasY(f1, height, PADDING.top, PADDING.bottom);

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.closePath();
      ctx.fill();
    },
    [getF1, getF2]
  );

  const drawHistoryPoints = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      historyPoints.forEach((point: HistoryPoint, index: number) => {
        const colors = VOWEL_COLORS[point.vowelId] || VOWEL_COLORS.i;
        const x = f2ToCanvasX(point.f2, width, PADDING.left, PADDING.right);
        const y = f1ToCanvasY(point.f1, height, PADDING.top, PADDING.bottom);
        const radius = 10;
        const opacity = 0.35 + (index / historyPoints.length) * 0.35;

        ctx.globalAlpha = opacity;

        ctx.beginPath();
        ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
        ctx.fillStyle = colors.glow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = colors.primary;
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px "Cormorant Garamond", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(point.ipa, x, y);

        ctx.globalAlpha = 1;
      });
    },
    [historyPoints]
  );

  const drawRealTimeTrail = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      if (formantHistory.length < 2) return;

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
      ctx.lineWidth = 2;

      formantHistory.forEach((point, index) => {
        const x = f2ToCanvasX(point.f2, width, PADDING.left, PADDING.right);
        const y = f1ToCanvasY(point.f1, height, PADDING.top, PADDING.bottom);

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    },
    [formantHistory]
  );

  const drawRealTimePoint = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!isAudioActive || !realTimeFormant) return;

      const { x, y } = realTimePointRef.current;
      const radius = 12;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
      gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.1)');
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
      ctx.fill();

      const pointGradient = ctx.createRadialGradient(
        x - radius * 0.3,
        y - radius * 0.3,
        0,
        x,
        y,
        radius
      );
      pointGradient.addColorStop(0, REAL_TIME_COLOR.primary);
      pointGradient.addColorStop(0.7, REAL_TIME_COLOR.light);
      pointGradient.addColorStop(1, REAL_TIME_COLOR.light);

      ctx.fillStyle = pointGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('●', x, y);
    },
    [isAudioActive, realTimeFormant]
  );

  const drawPoints = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      pointsRef.current.forEach((point) => {
        const { currentX, currentY, isSelected, scale, vowel } = point;
        const colors = VOWEL_COLORS[vowel.id] || VOWEL_COLORS.i;
        const baseRadius = 16;
        const radius = baseRadius * scale;

        if (isSelected) {
          const gradient = ctx.createRadialGradient(
            currentX,
            currentY,
            0,
            currentX,
            currentY,
            radius * 2
          );
          gradient.addColorStop(0, colors.glow);
          gradient.addColorStop(0.5, colors.glow.replace('0.4', '0.1'));
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(currentX, currentY, radius * 2, 0, Math.PI * 2);
          ctx.fill();
        }

        const pointGradient = ctx.createRadialGradient(
          currentX - radius * 0.3,
          currentY - radius * 0.3,
          0,
          currentX,
          currentY,
          radius
        );

        if (isSelected) {
          pointGradient.addColorStop(0, colors.primary);
          pointGradient.addColorStop(0.7, colors.light);
          pointGradient.addColorStop(1, colors.light);
        } else {
          pointGradient.addColorStop(0, '#64748b');
          pointGradient.addColorStop(0.7, '#475569');
          pointGradient.addColorStop(1, '#334155');
        }

        ctx.fillStyle = pointGradient;
        ctx.beginPath();
        ctx.arc(currentX, currentY, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = isSelected
          ? 'rgba(255, 255, 255, 0.8)'
          : 'rgba(148, 163, 184, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(14 * scale)}px 'Cormorant Garamond', serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(vowel.ipa, currentX, currentY);

        ctx.fillStyle = isSelected ? colors.primary : '#94a3b8';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText(vowel.exampleWord, currentX, currentY + radius + 16);
      });
    },
    []
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;

    ctx.clearRect(0, 0, width, height);

    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
    bgGradient.addColorStop(1, 'rgba(30, 41, 59, 0.95)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    drawGrid(ctx, width, height);
    drawVowelQuadrilateral(ctx, width, height);
    drawAxes(ctx, width, height);

    if (overlayMode) {
      drawHistoryPoints(ctx, width, height);
    }

    if (isAudioActive) {
      drawRealTimeTrail(ctx, width, height);
    }

    drawPoints(ctx);

    if (isAudioActive) {
      drawRealTimePoint(ctx);
    }
  }, [
    dimensions,
    drawGrid,
    drawAxes,
    drawVowelQuadrilateral,
    drawHistoryPoints,
    drawRealTimeTrail,
    drawRealTimePoint,
    drawPoints,
    overlayMode,
    isAudioActive,
  ]);

  const animate = useCallback(() => {
    let needsRedraw = false;

    pointsRef.current = pointsRef.current.map((point) => {
      const { currentX, currentY, targetX, targetY, scale, targetScale } = point;

      const newX = lerp(currentX, targetX, 0.12);
      const newY = lerp(currentY, targetY, 0.12);
      const newScale = lerp(scale, targetScale, 0.15);

      if (
        Math.abs(newX - targetX) > 0.5 ||
        Math.abs(newY - targetY) > 0.5 ||
        Math.abs(newScale - targetScale) > 0.01
      ) {
        needsRedraw = true;
      }

      return {
        ...point,
        currentX: Math.abs(newX - targetX) < 0.5 ? targetX : newX,
        currentY: Math.abs(newY - targetY) < 0.5 ? targetY : newY,
        scale: Math.abs(newScale - targetScale) < 0.01 ? targetScale : newScale,
      };
    });

    if (isAudioActive) {
      const { x, y, targetX, targetY } = realTimePointRef.current;
      const newX = lerp(x, targetX, 0.2);
      const newY = lerp(y, targetY, 0.2);

      if (
        Math.abs(newX - targetX) > 0.5 ||
        Math.abs(newY - targetY) > 0.5
      ) {
        needsRedraw = true;
      }

      realTimePointRef.current = {
        x: newX,
        y: newY,
        targetX,
        targetY,
      };
    }

    if (needsRedraw) {
      draw();
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [draw, isAudioActive]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      let found: HoveredVowel | null = null;

      for (const point of pointsRef.current) {
        const distance = Math.sqrt(
          Math.pow(x - point.currentX, 2) + Math.pow(y - point.currentY, 2)
        );
        if (distance < 25) {
          const f1 = getF1(point.vowel);
          const f2 = getF2(point.vowel);
          found = {
            vowel: point.vowel,
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            f1,
            f2,
          };
          break;
        }
      }

      setHoveredVowel(found);

      pointsRef.current = pointsRef.current.map((point) => {
        const distance = Math.sqrt(
          Math.pow(x - point.currentX, 2) + Math.pow(y - point.currentY, 2)
        );
        const isHovered = distance < 25;
        return {
          ...point,
          targetScale: point.isSelected ? 1 : isHovered ? 1.1 : 0.85,
        };
      });
    },
    [getF1, getF2]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredVowel(null);
    pointsRef.current = pointsRef.current.map((point) => ({
      ...point,
      targetScale: point.isSelected ? 1 : 0.85,
    }));
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      for (const point of pointsRef.current) {
        const distance = Math.sqrt(
          Math.pow(x - point.currentX, 2) + Math.pow(y - point.currentY, 2)
        );
        if (distance < 25) {
          useAppStore.getState().setSelectedVowelId(point.vowel.id);
          break;
        }
      }
    },
    []
  );

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const width = Math.max(500, Math.min(800, rect.width));
        const height = Math.round(width * 0.8);
        setDimensions({ width, height });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    initPoints();
  }, [initPoints]);

  useEffect(() => {
    updateTargetPositions();
  }, [updateTargetPositions]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [animate]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">F1-F2 元音声学平面图</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gradient-to-br from-sky-400 to-sky-600"></span>
            <span className="text-slate-400">选中</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gradient-to-br from-slate-500 to-slate-700"></span>
            <span className="text-slate-400">未选中</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 animate-pulse"></span>
            <span className="text-slate-400">实时语音</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-0.5 bg-purple-500/60" style={{ borderStyle: 'dashed' }}></span>
            <span className="text-slate-400">元音四边形</span>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative w-full rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl"
      >
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="w-full h-auto block cursor-pointer"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        />

        {hoveredVowel && (
          <div
            className="absolute pointer-events-none z-10 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl px-4 py-3 shadow-xl"
            style={{
              left: `${hoveredVowel.x + 15}px`,
              top: `${hoveredVowel.y - 10}px`,
              transform: 'translateY(-100%)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-2xl text-sky-400"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                [{hoveredVowel.vowel.ipa}]
              </span>
              <span className="text-slate-300 italic">
                {hoveredVowel.vowel.exampleWord}
              </span>
            </div>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-slate-500">F1: </span>
                <span
                  className="text-sky-400 font-mono"
                >{`${hoveredVowel.f1} Hz`}</span>
              </div>
              <div>
                <span className="text-slate-500">F2: </span>
                <span
                  className="text-cyan-400 font-mono"
                >{`${hoveredVowel.f2} Hz`}</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">点击选择此元音</p>
          </div>
        )}

        <div className="absolute top-4 right-4 text-xs text-slate-500 bg-slate-900/80 px-3 py-1.5 rounded-lg backdrop-blur-sm">
          基于 Ladefoged 标准值
        </div>

        {overlayMode && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            <span className="text-xs text-slate-400 bg-slate-900/80 px-2 py-1 rounded backdrop-blur-sm">
              历史记录: {historyPoints.length}
            </span>
            <button
              onClick={clearHistory}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all backdrop-blur-sm"
              title="清除历史记录"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}

        {isAudioActive && (
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">实时分析中</span>
          </div>
        )}
      </div>

      {overlayMode && historyPoints.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {Object.entries(VOWEL_COLORS).map(([id, colors]) => {
            const count = historyPoints.filter((p) => p.vowelId === id).length;
            if (count === 0) return null;
            const vowel = VOWELS.find((v) => v.id === id);
            return (
              <div
                key={id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 text-sm"
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors.primary }}
                ></span>
                <span className="text-slate-300 font-serif">[{vowel?.ipa}]</span>
                <span className="text-slate-500">×{count}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
