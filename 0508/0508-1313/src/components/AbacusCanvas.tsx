import { useRef, useEffect, useState, useCallback } from 'react';
import type { BeadColumn, AbacusType, DraggingBead } from '../types';
import { drawAbacus, hitTestBead, getBeadYPosition } from '../utils/beadRenderer';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants';

interface AbacusCanvasProps {
  beads: BeadColumn[];
  type: AbacusType;
  onToggleBead: (columnIndex: number, beadType: 'upper' | 'lower', beadIndex: number) => void;
  highlightedColumn?: number | null;
  disabled?: boolean;
}

export const AbacusCanvas = ({ beads, type, onToggleBead, highlightedColumn, disabled }: AbacusCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingBead, setDraggingBead] = useState<DraggingBead | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const width = Math.min(rect.width, CANVAS_WIDTH);
        const height = (width / CANVAS_WIDTH) * CANVAS_HEIGHT;
        setCanvasSize({ width, height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;
    canvas.style.width = `${canvasSize.width}px`;
    canvas.style.height = `${canvasSize.height}px`;
    ctx.scale(dpr, dpr);

    drawAbacus(ctx, beads, type, {
      width: canvasSize.width,
      height: canvasSize.height,
      draggingBead: draggingBead ? {
        ...draggingBead,
        currentY: (draggingBead.currentY / CANVAS_HEIGHT) * canvasSize.height,
        startY: (draggingBead.startY / CANVAS_HEIGHT) * canvasSize.height,
      } : null,
      highlightedColumn,
    });
  }, [beads, type, draggingBead, canvasSize, highlightedColumn]);

  const getScaledCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return;

    const { x, y } = getScaledCoords(e.clientX, e.clientY);
    const hit = hitTestBead(x, y, beads, type, CANVAS_WIDTH);

    if (hit) {
      setDraggingBead({
        columnIndex: hit.columnIndex,
        beadType: hit.beadType,
        beadIndex: hit.beadIndex,
        startY: y,
        currentY: y,
        originalPosition: hit.position,
      });
    }
  }, [beads, type, disabled, getScaledCoords]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingBead || disabled) return;

    const { y } = getScaledCoords(e.clientX, e.clientY);
    setDraggingBead(prev => prev ? { ...prev, currentY: y } : null);
  }, [draggingBead, disabled, getScaledCoords]);

  const handleMouseUp = useCallback(() => {
    if (!draggingBead || disabled) return;

    const { columnIndex, beadType, beadIndex, currentY, originalPosition, startY } = draggingBead;
    const threshold = 15;
    const dragDistance = currentY - startY;

    if (Math.abs(dragDistance) > threshold) {
      const shouldToggle = beadType === 'upper'
        ? (originalPosition === 0 && dragDistance > 0) || (originalPosition === 1 && dragDistance < 0)
        : (originalPosition === 0 && dragDistance < 0) || (originalPosition === 1 && dragDistance > 0);

      if (shouldToggle) {
        onToggleBead(columnIndex, beadType, beadIndex);
      }
    } else {
      onToggleBead(columnIndex, beadType, beadIndex);
    }

    setDraggingBead(null);
  }, [draggingBead, disabled, onToggleBead]);

  const handleMouseLeave = useCallback(() => {
    if (draggingBead) {
      setDraggingBead(null);
    }
  }, [draggingBead]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const { x, y } = getScaledCoords(touch.clientX, touch.clientY);
    const hit = hitTestBead(x, y, beads, type, CANVAS_WIDTH);

    if (hit) {
      e.preventDefault();
      setDraggingBead({
        columnIndex: hit.columnIndex,
        beadType: hit.beadType,
        beadIndex: hit.beadIndex,
        startY: y,
        currentY: y,
        originalPosition: hit.position,
      });
    }
  }, [beads, type, disabled, getScaledCoords]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!draggingBead || disabled || e.touches.length !== 1) return;

    e.preventDefault();
    const touch = e.touches[0];
    const { y } = getScaledCoords(touch.clientX, touch.clientY);
    setDraggingBead(prev => prev ? { ...prev, currentY: y } : null);
  }, [draggingBead, disabled, getScaledCoords]);

  const handleTouchEnd = useCallback(() => {
    if (!draggingBead || disabled) return;

    const { columnIndex, beadType, beadIndex, currentY, originalPosition, startY } = draggingBead;
    const threshold = 15;
    const dragDistance = currentY - startY;

    if (Math.abs(dragDistance) > threshold) {
      const shouldToggle = beadType === 'upper'
        ? (originalPosition === 0 && dragDistance > 0) || (originalPosition === 1 && dragDistance < 0)
        : (originalPosition === 0 && dragDistance < 0) || (originalPosition === 1 && dragDistance > 0);

      if (shouldToggle) {
        onToggleBead(columnIndex, beadType, beadIndex);
      }
    } else {
      onToggleBead(columnIndex, beadType, beadIndex);
    }

    setDraggingBead(null);
  }, [draggingBead, disabled, onToggleBead]);

  return (
    <div ref={containerRef} className="w-full flex justify-center items-center p-2">
      <canvas
        ref={canvasRef}
        className="rounded-xl shadow-2xl cursor-pointer touch-none"
        style={{ maxWidth: '100%', height: 'auto' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  );
};
