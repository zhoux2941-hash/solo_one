import { useRef, useEffect, useCallback } from 'react';
import { CellGrid } from '../../engine/CellGrid';
import { CellState } from '../../engine/types';
import { COLORS, GRID_SIZE, FIREFIGHTER_EXTINGUISH_RADIUS } from '../../engine/constants';

interface GridCanvasProps {
  grid: CellGrid | null;
  gridVersion: number;
  onCellClick: (x: number, y: number) => void;
  onCellRightClick: (x: number, y: number) => void;
  canvasSize?: number;
}

export function GridCanvas({
  grid,
  gridVersion,
  onCellClick,
  onCellRightClick,
  canvasSize = 600,
}: GridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const cellSize = canvasSize / GRID_SIZE;

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !grid) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    const time = Date.now() / 1000;

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const state = grid.getState(x, y);
        const px = x * cellSize;
        const py = y * cellSize;

        switch (state) {
          case CellState.TREE:
            ctx.fillStyle = COLORS.TREE;
            ctx.fillRect(px, py, cellSize, cellSize);
            break;

          case CellState.FIRE:
            const burnTime = grid.getBurnTime(x, y);
            const flicker = Math.sin(time * 10 + x + y) * 0.3 + 0.7;
            const intensity = Math.max(0, 1 - burnTime / 4);

            const r = Math.floor(255 * flicker * intensity);
            const g = Math.floor(100 * flicker * intensity);
            ctx.fillStyle = `rgb(${r}, ${g}, 0)`;
            ctx.fillRect(px, py, cellSize, cellSize);

            const fireGlowSize = cellSize * (0.3 + flicker * 0.2);
            const fireGradient = ctx.createRadialGradient(
              px + cellSize / 2,
              py + cellSize / 2,
              0,
              px + cellSize / 2,
              py + cellSize / 2,
              fireGlowSize
            );
            fireGradient.addColorStop(0, 'rgba(255, 200, 50, 0.6)');
            fireGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
            ctx.fillStyle = fireGradient;
            ctx.fillRect(px - fireGlowSize / 2, py - fireGlowSize / 2, cellSize + fireGlowSize, cellSize + fireGlowSize);
            break;

          case CellState.ASH:
            ctx.fillStyle = COLORS.ASH;
            ctx.fillRect(px, py, cellSize, cellSize);
            break;

          case CellState.FIREFIGHTER:
            ctx.fillStyle = COLORS.EMPTY;
            ctx.fillRect(px, py, cellSize, cellSize);
            
            const firefighterPulse = Math.sin(time * 3 + x + y) * 0.2 + 0.8;
            const ffSize = cellSize * 0.8 * firefighterPulse;
            const ffOffset = (cellSize - ffSize) / 2;
            
            ctx.fillStyle = COLORS.FIREFIGHTER;
            ctx.beginPath();
            ctx.arc(
              px + cellSize / 2,
              py + cellSize / 2,
              ffSize / 2,
              0,
              Math.PI * 2
            );
            ctx.fill();
            
            ctx.fillStyle = COLORS.FIREFIGHTER_GLOW;
            ctx.font = `${cellSize * 0.6}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🧑‍🚒', px + cellSize / 2, py + cellSize / 2);
            
            const ffGlowRadius = cellSize * FIREFIGHTER_EXTINGUISH_RADIUS;
            const ffGradient = ctx.createRadialGradient(
              px + cellSize / 2,
              py + cellSize / 2,
              0,
              px + cellSize / 2,
              py + cellSize / 2,
              ffGlowRadius
            );
            ffGradient.addColorStop(0, 'rgba(30, 144, 255, 0.15)');
            ffGradient.addColorStop(1, 'rgba(30, 144, 255, 0)');
            ctx.fillStyle = ffGradient;
            ctx.fillRect(
              px - ffGlowRadius + cellSize / 2,
              py - ffGlowRadius + cellSize / 2,
              ffGlowRadius * 2,
              ffGlowRadius * 2
            );
            break;

          case CellState.EMPTY:
          default:
            ctx.fillStyle = COLORS.EMPTY;
            ctx.fillRect(px, py, cellSize, cellSize);
            break;
        }
      }
    }

    ctx.strokeStyle = COLORS.GRID_LINE;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvasSize);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvasSize, i * cellSize);
      ctx.stroke();
    }

    animationFrameRef.current = requestAnimationFrame(render);
  }, [grid, canvasSize, cellSize]);

  useEffect(() => {
    render();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render, gridVersion]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / cellSize);
      const y = Math.floor((e.clientY - rect.top) / cellSize);

      if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
        onCellClick(x, y);
      }
    },
    [cellSize, onCellClick]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / cellSize);
      const y = Math.floor((e.clientY - rect.top) / cellSize);

      if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
        onCellRightClick(x, y);
      }
    },
    [cellSize, onCellRightClick]
  );

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      className="border-4 border-emerald-900 rounded-lg shadow-2xl cursor-crosshair"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
