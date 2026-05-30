import React, { useEffect, useRef } from 'react';
import { useIncenseStore } from '../store/useIncenseStore';
import { drawAshCanvas } from '../utils/incenseSimulator';

interface AshCanvasProps {
  width?: number;
  height?: number;
}

export const AshCanvas: React.FC<AshCanvasProps> = ({ width = 300, height = 150 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { incenseState, tick } = useIncenseStore();
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      tick(width);
      drawAshCanvas(
        ctx,
        width,
        height,
        incenseState.ashParticles,
        incenseState.ashColor,
        incenseState.burnTime,
        incenseState.temperature
      );
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [width, height, incenseState.ashParticles, incenseState.ashColor, incenseState.burnTime, incenseState.temperature, tick]);

  return (
    <div ref={containerRef} className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-xl"
      />
      {!incenseState.isBurning && incenseState.burnTime === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-stone-400 text-sm">点击"开始熏香"体验</p>
        </div>
      )}
    </div>
  );
};
