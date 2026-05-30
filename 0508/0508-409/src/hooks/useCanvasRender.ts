import { useRef, useEffect, useCallback } from 'react';
import { DrawPath, FoldStep, CANVAS_SIZE, Point } from '../types';
import { renderFullScene } from '../utils/paperRenderer';
import { getFoldRegion, clampPointToRegion, globalToLocal } from '../utils/geometry';

interface UseCanvasRenderOptions {
  currentFoldStep: FoldStep;
  drawPaths: DrawPath[];
  currentPath: DrawPath | null;
  isUnfolding: boolean;
  unfoldProgress: number;
  showFinalResult: boolean;
  isAnimating: boolean;
  onMouseDown?: (point: Point) => void;
  onMouseMove?: (point: Point) => void;
  onMouseUp?: () => void;
  onMouseLeave?: () => void;
}

export function useCanvasRender(options: UseCanvasRenderOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  const {
    currentFoldStep,
    drawPaths,
    currentPath,
    isUnfolding,
    unfoldProgress,
    showFinalResult,
    isAnimating,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
  } = options;

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    renderFullScene(ctx, currentFoldStep, drawPaths, currentPath, isUnfolding, unfoldProgress, showFinalResult);
    ctx.restore();
  }, [currentFoldStep, drawPaths, currentPath, isUnfolding, unfoldProgress, showFinalResult]);

  useEffect(() => {
    render();
  }, [render]);

  useEffect(() => {
    if (isAnimating && !isUnfolding) {
      const startTime = Date.now();
      const duration = 600;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.save();
            const scale = 1 - Math.sin(progress * Math.PI) * 0.05;
            ctx.translate(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
            ctx.scale(scale, scale);
            ctx.translate(-CANVAS_SIZE / 2, -CANVAS_SIZE / 2);
            renderFullScene(ctx, currentFoldStep, drawPaths, currentPath, isUnfolding, unfoldProgress, showFinalResult);
            ctx.restore();
          }
        }
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          render();
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
      return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };
    }
  }, [isAnimating, isUnfolding, render, currentFoldStep, drawPaths, currentPath, unfoldProgress, showFinalResult]);

  const getCanvasPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const globalX = (e.clientX - rect.left) * (CANVAS_SIZE / rect.width);
    const globalY = (e.clientY - rect.top) * (CANVAS_SIZE / rect.height);
    const globalPoint = { x: globalX, y: globalY };

    if (currentFoldStep > 0) {
      const region = getFoldRegion(currentFoldStep);
      const clamped = clampPointToRegion(globalPoint, region);
      return globalToLocal(clamped, currentFoldStep);
    }
    return globalToLocal(globalPoint, 0);
  }, [currentFoldStep]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (onMouseDown) onMouseDown(getCanvasPoint(e));
  }, [onMouseDown, getCanvasPoint]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (onMouseMove) onMouseMove(getCanvasPoint(e));
  }, [onMouseMove, getCanvasPoint]);

  const handleMouseUp = useCallback(() => {
    if (onMouseUp) onMouseUp();
  }, [onMouseUp]);

  const handleMouseLeave = useCallback(() => {
    if (onMouseLeave) onMouseLeave();
  }, [onMouseLeave]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY } as React.MouseEvent<HTMLCanvasElement>);
  }, [handleMouseDown]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY } as React.MouseEvent<HTMLCanvasElement>);
  }, [handleMouseMove]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    handleMouseUp();
  }, [handleMouseUp]);

  return {
    canvasRef,
    render,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
