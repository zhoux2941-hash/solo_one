import { useCallback, useRef, useEffect, useRef as useReactRef } from 'react';
import { ControlPanel } from '../components/ControlPanel';
import { FractalCanvas } from '../components/FractalCanvas';
import { useFractalRenderer } from '../hooks/useFractalRenderer';
import { useFractalStore } from '../store/fractalStore';
import { ViewState } from '../types/fractal';

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { render, recolor, stopRender, isRendering } = useFractalRenderer(canvasRef, CANVAS_WIDTH, CANVAS_HEIGHT);
  const { viewState, resetViewState } = useFractalStore();

  const prevViewRef = useReactRef<ViewState | null>(null);

  useEffect(() => {
    if (!prevViewRef.current) {
      prevViewRef.current = { ...viewState };
      return;
    }

    const prev = prevViewRef.current;
    const geometryChanged =
      prev.centerX !== viewState.centerX ||
      prev.centerY !== viewState.centerY ||
      prev.zoom !== viewState.zoom;

    const colorParamsChanged =
      prev.maxIterations !== viewState.maxIterations ||
      prev.palette !== viewState.palette;

    if (geometryChanged) {
      render();
    } else if (colorParamsChanged && !isRendering) {
      recolor();
    }

    prevViewRef.current = { ...viewState };
  }, [viewState.centerX, viewState.centerY, viewState.zoom, viewState.maxIterations, viewState.palette, render, recolor, isRendering]);

  const handleRender = useCallback(() => {
    render();
  }, [render]);

  const handleStop = useCallback(() => {
    stopRender();
  }, [stopRender]);

  const handleReset = useCallback(() => {
    resetViewState();
    setTimeout(() => render(), 50);
  }, [resetViewState, render]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#050814]">
      <ControlPanel
        onRender={handleRender}
        onStop={handleStop}
        onReset={handleReset}
      />
      <FractalCanvas
        canvasRef={canvasRef}
        onRender={handleRender}
      />
    </div>
  );
}