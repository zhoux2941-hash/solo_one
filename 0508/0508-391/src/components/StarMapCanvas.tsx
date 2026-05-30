import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useStarMapStore } from '../store/useStarMapStore';
import {
  project,
  magnitudeToRadius,
  generateGridPoints,
  calculateOptimalScale,
} from '../utils/projections';
import { generatePlotterSteps, getCurrentStepIndex, getStepProgress } from '../utils/plotterSteps';
import { CONSTELLATION_COLORS } from '../../shared/types';
import type { Star, Constellation, Connection, ProjectedPoint, ProjectionParams } from '../../shared/types';

interface StarMapCanvasProps {
  width: number;
  height: number;
}

interface ProjectedStar extends Star {
  projected: ProjectedPoint;
}

export const StarMapCanvas = ({ width, height }: StarMapCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const starsRef = useRef<ProjectedStar[]>([]);
  const plotterStepsRef = useRef<ReturnType<typeof generatePlotterSteps>>([]);

  const {
    stars,
    constellations,
    connections,
    projection,
    autoScale,
    showConstellationLines,
    showGrid,
    showStarLabels,
    hoveredStarId,
    selectedStarId,
    plotterMode,
    setHoveredStarId,
    setSelectedStarId,
    setProjection,
    setPlotterProgress,
  } = useStarMapStore();

  const centerX = width / 2;
  const centerY = height / 2;

  const effectiveProjection = useMemo((): ProjectionParams => {
    if (!autoScale || stars.length === 0) {
      return projection;
    }

    const optimalScale = calculateOptimalScale(
      stars,
      {
        type: projection.type,
        centerRa: projection.centerRa,
        centerDec: projection.centerDec,
        rotation: projection.rotation,
      },
      width,
      height,
      0.85
    );

    return { ...projection, scale: optimalScale };
  }, [stars, projection, autoScale, width, height]);

  useEffect(() => {
    if (autoScale && stars.length > 0) {
      const optimalScale = calculateOptimalScale(
        stars,
        {
          type: projection.type,
          centerRa: projection.centerRa,
          centerDec: projection.centerDec,
          rotation: projection.rotation,
        },
        width,
        height,
        0.85
      );
      setProjection({ scale: optimalScale });
    }
  }, [projection.type, projection.centerRa, projection.centerDec, projection.rotation, autoScale, stars, width, height, setProjection]);

  const constellationMap = useMemo(
    () => new Map<number, Constellation>(constellations.map((c) => [c.id, c])),
    [constellations]
  );

  const projectedStars = useMemo(() => {
    return stars
      .map((star) => ({
        ...star,
        projected: project(star.ra, star.dec, effectiveProjection),
      }))
      .filter((s) => s.projected.visible) as ProjectedStar[];
  }, [stars, effectiveProjection]);

  const grid = useMemo(
    () => generateGridPoints(effectiveProjection, centerX, centerY),
    [effectiveProjection, centerX, centerY]
  );

  const starMap = useMemo(() => {
    const map = new Map<number, ProjectedStar>();
    for (const star of projectedStars) {
      map.set(star.id, star);
    }
    return map;
  }, [projectedStars]);

  const drawStar = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      star: ProjectedStar,
      isHovered: boolean,
      isSelected: boolean,
      centerX: number,
      centerY: number
    ) => {
      const x = centerX + star.projected.x;
      const y = centerY + star.projected.y;
      const alpha = star.projected.alpha ?? 1;
      const baseRadius = magnitudeToRadius(star.magnitude, 1.2);
      const radius = isSelected ? baseRadius * 2.5 : isHovered ? baseRadius * 2 : baseRadius;

      if (alpha < 1) {
        ctx.globalAlpha = alpha;
      }

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
      gradient.addColorStop(0, `rgba(245, 240, 230, ${alpha})`);
      gradient.addColorStop(0.3, `rgba(245, 240, 230, ${alpha * 0.6})`);
      gradient.addColorStop(1, 'rgba(245, 240, 230, 0)');

      ctx.beginPath();
      ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#f5f0e6';
      ctx.fill();

      if ((isHovered || isSelected || showStarLabels) && star.magnitude <= 4 && alpha > 0.3) {
        ctx.font = `${isSelected ? 14 : 11}px "Noto Serif SC", serif`;
        ctx.fillStyle = isSelected ? '#f5f0e6' : '#d4c5a9';
        ctx.textAlign = 'left';
        ctx.fillText(star.name, x + radius + 6, y + 4);
      }

      ctx.globalAlpha = 1;
    },
    [showStarLabels]
  );

  const drawConstellationLine = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      conn: Connection,
      centerX: number,
      centerY: number,
      baseAlpha: number = 0.7
    ) => {
      const constellation = constellationMap.get(conn.constellationId);
      if (!constellation) return;

      const fromStar = starMap.get(conn.fromStarId);
      const toStar = starMap.get(conn.toStarId);

      if (!fromStar || !toStar) return;

      const fromAlpha = fromStar.projected.alpha ?? 1;
      const toAlpha = toStar.projected.alpha ?? 1;
      const lineAlpha = Math.min(fromAlpha, toAlpha) * baseAlpha;

      if (lineAlpha < 0.05) return;

      const x1 = centerX + fromStar.projected.x;
      const y1 = centerY + fromStar.projected.y;
      const x2 = centerX + toStar.projected.x;
      const y2 = centerY + toStar.projected.y;

      const color = CONSTELLATION_COLORS[constellation.type] || '#8b7355';

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = color;
      ctx.globalAlpha = lineAlpha;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.globalAlpha = 1;

      if (lineAlpha > 0.3) {
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const arrowSize = 6;

        ctx.beginPath();
        ctx.moveTo(midX, midY);
        ctx.lineTo(
          midX - arrowSize * Math.cos(angle - Math.PI / 6),
          midY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(midX, midY);
        ctx.lineTo(
          midX - arrowSize * Math.cos(angle + Math.PI / 6),
          midY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.strokeStyle = color;
        ctx.globalAlpha = lineAlpha;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    },
    [constellationMap, starMap]
  );

  const drawConstellationLabel = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      constellation: Constellation,
      centerX: number,
      centerY: number
    ) => {
      const constellationStars = projectedStars.filter(
        (s) => s.constellationId === constellation.id
      );
      if (constellationStars.length === 0) return;

      const minAlpha = Math.min(...constellationStars.map(s => s.projected.alpha ?? 1));
      if (minAlpha < 0.3) return;

      const avgX =
        constellationStars.reduce((sum, s) => sum + s.projected.x, 0) / constellationStars.length;
      const avgY =
        constellationStars.reduce((sum, s) => sum + s.projected.y, 0) / constellationStars.length;

      const x = centerX + avgX;
      const y = centerY + avgY - 15;
      const color = CONSTELLATION_COLORS[constellation.type] || '#8b7355';

      ctx.font = 'bold 16px "Noto Serif SC", serif';
      ctx.fillStyle = color;
      ctx.globalAlpha = minAlpha;
      ctx.textAlign = 'center';
      ctx.fillText(constellation.name, x, y);
      ctx.globalAlpha = 1;
    },
    [projectedStars]
  );

  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.strokeStyle = '#2e5eaa';
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 0.5;

      for (const circle of grid.circles) {
        ctx.beginPath();
        ctx.arc(circle.cx, circle.cy, circle.r, 0, Math.PI * 2);
        ctx.stroke();
      }

      for (const line of grid.lines) {
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    },
    [grid]
  );

  const drawPlotterStep = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      step: ReturnType<typeof generatePlotterSteps>[0],
      stepProgress: number
    ) => {
      const { type, data } = step;
      const color = data.color || '#f5f0e6';

      switch (type) {
        case 'circle': {
          if (data.cx === undefined || data.cy === undefined || data.r === undefined) return;
          const startAngle = data.startAngle || 0;
          const endAngle = data.endAngle || Math.PI * 2;
          const currentEnd = startAngle + (endAngle - startAngle) * stepProgress;

          const compassX =
            data.cx + data.r * Math.cos(startAngle + (endAngle - startAngle) * stepProgress * 0.5);
          const compassY =
            data.cy + data.r * Math.sin(startAngle + (endAngle - startAngle) * stepProgress * 0.5);

          ctx.beginPath();
          ctx.moveTo(data.cx, data.cy);
          ctx.lineTo(compassX, compassY);
          ctx.strokeStyle = '#8b7355';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(data.cx, data.cy, 8, 0, Math.PI * 2);
          ctx.fillStyle = '#5c4a3a';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(data.cx, data.cy, data.r, startAngle, currentEnd);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          const penX = data.cx + data.r * Math.cos(currentEnd);
          const penY = data.cy + data.r * Math.sin(currentEnd);
          ctx.beginPath();
          ctx.arc(penX, penY, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#c41e3a';
          ctx.fill();
          break;
        }

        case 'line': {
          if (
            data.x1 === undefined ||
            data.y1 === undefined ||
            data.x2 === undefined ||
            data.y2 === undefined
          )
            return;

          const currentX = data.x1 + (data.x2 - data.x1) * stepProgress;
          const currentY = data.y1 + (data.y2 - data.y1) * stepProgress;

          const rulerAngle = Math.atan2(data.y2 - data.y1, data.x2 - data.x1);
          const rulerLength = Math.sqrt((data.x2 - data.x1) ** 2 + (data.y2 - data.y1) ** 2);
          const rulerOffset = 15;
          const rulerPerpX = -Math.sin(rulerAngle) * rulerOffset;
          const rulerPerpY = Math.cos(rulerAngle) * rulerOffset;

          ctx.strokeStyle = '#8b7355';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(data.x1 + rulerPerpX, data.y1 + rulerPerpY);
          ctx.lineTo(data.x2 + rulerPerpX, data.y2 + rulerPerpY);
          ctx.stroke();

          ctx.strokeStyle = '#5c4a3a';
          ctx.lineWidth = 1;
          for (let i = 0; i <= rulerLength; i += 20) {
            const t = i / rulerLength;
            const markX = data.x1 + (data.x2 - data.x1) * t + rulerPerpX;
            const markY = data.y1 + (data.y2 - data.y1) * t + rulerPerpY;
            ctx.beginPath();
            ctx.moveTo(markX - 3 * Math.sin(rulerAngle), markY + 3 * Math.cos(rulerAngle));
            ctx.lineTo(markX + 3 * Math.sin(rulerAngle), markY - 3 * Math.cos(rulerAngle));
            ctx.stroke();
          }

          ctx.beginPath();
          ctx.moveTo(data.x1, data.y1);
          ctx.lineTo(currentX, currentY);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(currentX, currentY, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#c41e3a';
          ctx.fill();
          break;
        }

        case 'point': {
          if (data.px === undefined || data.py === undefined) return;
          const r = (data.r || 3) * Math.min(1, stepProgress * 2);

          ctx.strokeStyle = '#8b7355';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(data.px - 15, data.py);
          ctx.lineTo(data.px + 15, data.py);
          ctx.moveTo(data.px, data.py - 15);
          ctx.lineTo(data.px, data.py + 15);
          ctx.stroke();

          const gradient = ctx.createRadialGradient(data.px, data.py, 0, data.px, data.py, r * 3);
          gradient.addColorStop(0, color);
          gradient.addColorStop(0.3, color + '99');
          gradient.addColorStop(1, color + '00');

          ctx.beginPath();
          ctx.arc(data.px, data.py, r * 3, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(data.px, data.py, r, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          break;
        }

        case 'text': {
          if (data.px === undefined || data.py === undefined || !data.text) return;
          const fontSize = data.fontSize || 14;
          const displayText = data.text.slice(0, Math.ceil(data.text.length * stepProgress));

          ctx.font = `bold ${fontSize}px "Noto Serif SC", serif`;
          ctx.fillStyle = color;
          ctx.textAlign = 'center';
          ctx.fillText(displayText, data.px, data.py);
          break;
        }
      }
    },
    []
  );

  const drawNormal = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const bgGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        Math.max(width, height) / 2
      );
      bgGradient.addColorStop(0, '#0a1628');
      bgGradient.addColorStop(1, '#050a12');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      if (showGrid) {
        drawGrid(ctx);
      }

      if (showConstellationLines) {
        for (const conn of connections) {
          drawConstellationLine(ctx, conn, centerX, centerY);
        }
      }

      const sortedStars = [...projectedStars].sort((a, b) => b.magnitude - a.magnitude);

      for (const star of sortedStars) {
        const isHovered = hoveredStarId === star.id;
        const isSelected = selectedStarId === star.id;
        drawStar(ctx, star, isHovered, isSelected, centerX, centerY);
      }

      if (showConstellationLines) {
        for (const constellation of constellations) {
          drawConstellationLabel(ctx, constellation, centerX, centerY);
        }
      }
    },
    [
      width,
      height,
      centerX,
      centerY,
      showGrid,
      showConstellationLines,
      connections,
      projectedStars,
      constellations,
      hoveredStarId,
      selectedStarId,
      drawGrid,
      drawConstellationLine,
      drawStar,
      drawConstellationLabel,
    ]
  );

  const drawPlotter = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const bgGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        Math.max(width, height) / 2
      );
      bgGradient.addColorStop(0, '#f5f0e6');
      bgGradient.addColorStop(1, '#e8e0d0');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = '#8b7355';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, width - 40, height - 40);

      ctx.strokeStyle = '#5c4a3a';
      ctx.lineWidth = 1;
      ctx.strokeRect(30, 30, width - 60, height - 60);

      const steps = plotterStepsRef.current;
      if (steps.length === 0) return;

      const currentIdx = getCurrentStepIndex(plotterMode.progress, steps.length);
      const stepProgress = getStepProgress(plotterMode.progress, steps.length);

      for (let i = 0; i < currentIdx; i++) {
        const step = steps[i];
        switch (step.type) {
          case 'circle':
            if (step.data.cx !== undefined && step.data.cy !== undefined && step.data.r !== undefined) {
              ctx.beginPath();
              ctx.arc(step.data.cx, step.data.cy, step.data.r, 0, Math.PI * 2);
              ctx.strokeStyle = step.data.color || '#2e5eaa';
              ctx.lineWidth = 1;
              ctx.globalAlpha = 0.5;
              ctx.stroke();
              ctx.globalAlpha = 1;
            }
            break;
          case 'line':
            if (
              step.data.x1 !== undefined &&
              step.data.y1 !== undefined &&
              step.data.x2 !== undefined &&
              step.data.y2 !== undefined
            ) {
              ctx.beginPath();
              ctx.moveTo(step.data.x1, step.data.y1);
              ctx.lineTo(step.data.x2, step.data.y2);
              ctx.strokeStyle = step.data.color || '#2e5eaa';
              ctx.lineWidth = 1;
              ctx.globalAlpha = 0.5;
              ctx.stroke();
              ctx.globalAlpha = 1;
            }
            break;
          case 'point':
            if (step.data.px !== undefined && step.data.py !== undefined) {
              const r = step.data.r || 2;
              ctx.beginPath();
              ctx.arc(step.data.px, step.data.py, r, 0, Math.PI * 2);
              ctx.fillStyle = step.data.color || '#0a1628';
              ctx.globalAlpha = 0.8;
              ctx.fill();
              ctx.globalAlpha = 1;
            }
            break;
          case 'text':
            if (step.data.px !== undefined && step.data.py !== undefined && step.data.text) {
              ctx.font = `bold ${step.data.fontSize || 14}px "Noto Serif SC", serif`;
              ctx.fillStyle = step.data.color || '#0a1628';
              ctx.textAlign = 'center';
              ctx.globalAlpha = 0.7;
              ctx.fillText(step.data.text, step.data.px, step.data.py);
              ctx.globalAlpha = 1;
            }
            break;
        }
      }

      if (currentIdx < steps.length) {
        drawPlotterStep(ctx, steps[currentIdx], stepProgress);
      }
    },
    [width, height, centerX, centerY, plotterMode.progress, drawPlotterStep]
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (plotterMode.active) {
      drawPlotter(ctx);
    } else {
      drawNormal(ctx);
    }
  }, [plotterMode.active, drawNormal, drawPlotter]);

  useEffect(() => {
    starsRef.current = projectedStars;
  }, [projectedStars]);

  useEffect(() => {
    plotterStepsRef.current = generatePlotterSteps(
      stars,
      constellations,
      connections,
      effectiveProjection,
      centerX,
      centerY
    );
  }, [stars, constellations, connections, effectiveProjection, centerX, centerY]);

  useEffect(() => {
    const animate = () => {
      render();

      if (plotterMode.active && !plotterMode.paused) {
        const newProgress = Math.min(1, plotterMode.progress + 0.0015 * plotterMode.speed);
        setPlotterProgress(newProgress);

        if (newProgress >= 1) {
          setTimeout(() => {
            useStarMapStore.getState().stopPlotterMode();
          }, 1000);
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [render, plotterMode.active, plotterMode.paused, plotterMode.progress, plotterMode.speed, setPlotterProgress]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (plotterMode.active) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      let foundStar: ProjectedStar | null = null;
      let minDist = Infinity;

      for (const star of projectedStars) {
        const starX = centerX + star.projected.x;
        const starY = centerY + star.projected.y;
        const dist = Math.sqrt((x - starX) ** 2 + (y - starY) ** 2);
        const hitRadius = Math.max(magnitudeToRadius(star.magnitude, 2), 8);

        if (dist < hitRadius && dist < minDist) {
          minDist = dist;
          foundStar = star;
        }
      }

      setHoveredStarId(foundStar ? foundStar.id : null);
      canvas.style.cursor = foundStar ? 'pointer' : 'default';
    },
    [projectedStars, centerX, centerY, plotterMode.active, setHoveredStarId]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (plotterMode.active) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      let foundStar: ProjectedStar | null = null;
      let minDist = Infinity;

      for (const star of projectedStars) {
        const starX = centerX + star.projected.x;
        const starY = centerY + star.projected.y;
        const dist = Math.sqrt((x - starX) ** 2 + (y - starY) ** 2);
        const hitRadius = Math.max(magnitudeToRadius(star.magnitude, 2), 8);

        if (dist < hitRadius && dist < minDist) {
          minDist = dist;
          foundStar = star;
        }
      }

      if (foundStar) {
        setSelectedStarId(selectedStarId === foundStar.id ? null : foundStar.id);
      } else {
        setSelectedStarId(null);
      }
    },
    [projectedStars, centerX, centerY, plotterMode.active, selectedStarId, setSelectedStarId]
  );

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      onMouseLeave={() => setHoveredStarId(null)}
      className="rounded-lg shadow-2xl"
    />
  );
};
