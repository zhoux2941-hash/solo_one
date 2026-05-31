import { useCallback, useEffect } from 'react';
import { useFractalStore } from '../store/fractalStore';
import { pixelToComplex } from '../utils/mandelbrot';
import { ProgressBar } from './ProgressBar';
import { InfoPanel } from './InfoPanel';

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;

interface FractalCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onRender: () => void;
}

export function FractalCanvas({ canvasRef, onRender }: FractalCanvasProps) {
  const { viewState, setViewState } = useFractalStore();

  useEffect(() => {
    onRender();
  }, []);

  useEffect(() => {
    onRender();
  }, [viewState.palette, onRender]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      const { cx, cy } = pixelToComplex(
        x,
        y,
        viewState,
        CANVAS_WIDTH,
        CANVAS_HEIGHT
      );

      setViewState({
        centerX: cx,
        centerY: cy,
        zoom: Math.min(viewState.zoom * 4, 1e12),
      });

      setTimeout(() => {
        onRender();
      }, 50);
    },
    [viewState, setViewState, onRender, canvasRef]
  );

  return (
    <div className="flex-1 flex items-center justify-center bg-[#050814] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-cyan-900/10 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
      
      <div className="relative shadow-2xl shadow-purple-500/10">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleCanvasClick}
          className="border border-purple-500/30 rounded-sm cursor-crosshair max-w-full max-h-[calc(100vh-8rem)]"
          style={{ imageRendering: 'pixelated' }}
        />
        <ProgressBar />
        <InfoPanel />
      </div>

      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 font-mono">
        点击画布任意位置进行深度探索
      </div>
    </div>
  );
}
