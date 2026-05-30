import { useRef, useEffect } from 'react';
import { useSpectrum } from '@/hooks/useSpectrum';

interface SpectrumCanvasProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
  type?: 'bars' | 'line';
  color?: string;
  backgroundColor?: string;
  referenceFrequency?: number;
  height?: number;
  className?: string;
}

export const SpectrumCanvas = ({
  analyser,
  isActive,
  type = 'bars',
  color = '#1E3A5F',
  backgroundColor = '#F5F0E8',
  referenceFrequency,
  height = 120,
  className = '',
}: SpectrumCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { startAnimation, stopAnimation } = useSpectrum({
    analyser,
    canvasRef,
    type,
    color,
    backgroundColor,
    referenceFrequency,
  });

  useEffect(() => {
    if (isActive && analyser) {
      startAnimation();
    } else {
      stopAnimation();
    }
  }, [isActive, analyser, startAnimation, stopAnimation]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={height}
      className={`w-full rounded-xl ${className}`}
      style={{ backgroundColor }}
    />
  );
};
