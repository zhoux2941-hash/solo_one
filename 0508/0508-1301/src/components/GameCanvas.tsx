import { useRef, useEffect, useCallback, useState } from "react";
import useGameStore from "@/hooks/useGameStore";
import { renderGridToCanvas } from "@/utils/gridRenderer";

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const drawValueRef = useRef(1);
  const timerRef = useRef<number | null>(null);
  const [, setRenderTick] = useState(0);

  const grid = useGameStore((s) => s.grid);
  const rows = useGameStore((s) => s.rows);
  const cols = useGameStore((s) => s.cols);
  const showGridLines = useGameStore((s) => s.showGridLines);
  const isRunning = useGameStore((s) => s.isRunning);
  const toggleCell = useGameStore((s) => s.toggleCell);
  const adaptiveSpeed = useGameStore((s) => s.adaptiveSpeed);
  const getEffectiveSpeed = useGameStore((s) => s.getEffectiveSpeed);
  const step = useGameStore((s) => s.step);

  useEffect(() => {
    if (!isRunning) return;

    const tick = () => {
      step();
      timerRef.current = window.setTimeout(tick, getEffectiveSpeed());
    };

    timerRef.current = window.setTimeout(tick, getEffectiveSpeed());

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, adaptiveSpeed, getEffectiveSpeed, step]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderGridToCanvas(canvas, grid, rows, cols, { showGridLines });
  }, [grid, rows, cols, showGridLines]);

  useEffect(() => {
    const handleResize = () => setRenderTick((t) => t + 1);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getCellCoords = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const cellW = rect.width / cols;
      const cellH = rect.height / rows;
      const cellSize = Math.min(cellW, cellH);
      const offsetX = (rect.width - cellSize * cols) / 2;
      const offsetY = (rect.height - cellSize * rows) / 2;
      const x = e.clientX - rect.left - offsetX;
      const y = e.clientY - rect.top - offsetY;
      const col = Math.floor(x / cellSize);
      const row = Math.floor(y / cellSize);
      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        return { row, col };
      }
      return null;
    },
    [rows, cols]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isRunning) return;
      const coords = getCellCoords(e);
      if (!coords) return;
      isDrawingRef.current = true;
      const idx = coords.row * cols + coords.col;
      drawValueRef.current = grid[idx] ? 0 : 1;
      toggleCell(coords.row, coords.col);
    },
    [isRunning, getCellCoords, toggleCell, cols, grid]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || isRunning) return;
      const coords = getCellCoords(e);
      if (!coords) return;
      const idx = coords.row * cols + coords.col;
      if (grid[idx] !== drawValueRef.current) {
        toggleCell(coords.row, coords.col);
      }
    },
    [isRunning, getCellCoords, toggleCell, cols, grid]
  );

  const handleMouseUp = useCallback(() => {
    isDrawingRef.current = false;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-crosshair rounded-lg"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
}
