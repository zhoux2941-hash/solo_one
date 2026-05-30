import { useRef, useEffect, useCallback } from 'react';

interface UseSpectrumOptions {
  analyser: AnalyserNode | null;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  type?: 'bars' | 'line';
  color?: string;
  backgroundColor?: string;
  referenceFrequency?: number;
}

interface UseSpectrumReturn {
  startAnimation: () => void;
  stopAnimation: () => void;
}

export const useSpectrum = ({
  analyser,
  canvasRef,
  type = 'bars',
  color = '#1E3A5F',
  backgroundColor = 'transparent',
  referenceFrequency,
}: UseSpectrumOptions): UseSpectrumReturn => {
  const animationFrameRef = useRef<number>(0);
  const isAnimatingRef = useRef<boolean>(false);

  const drawSpectrum = useCallback(() => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isAnimatingRef.current || !analyser || !ctx || !canvas) return;

      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (type === 'bars') {
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;

          const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
          gradient.addColorStop(0, color);
          gradient.addColorStop(1, adjustColor(color, 30));

          ctx.fillStyle = gradient;
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

          x += barWidth;
        }
      } else {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 255;
          const y = canvas.height - (v * canvas.height * 0.8) - 10;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height);
        ctx.stroke();
      }

      if (referenceFrequency) {
        const nyquist = audioContextRef.current?.sampleRate ? audioContextRef.current.sampleRate / 2 : 24000;
        const refX = (referenceFrequency / nyquist) * (bufferLength * 2.5);

        ctx.strokeStyle = '#9B2C2C';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(refX, 0);
        ctx.lineTo(refX, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#9B2C2C';
        ctx.font = '12px sans-serif';
        ctx.fillText(`${referenceFrequency}Hz`, refX + 5, 15);
      }
    };

    draw();
  }, [analyser, canvasRef, type, color, backgroundColor, referenceFrequency]);

  const startAnimation = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    drawSpectrum();
  }, [drawSpectrum]);

  const stopAnimation = useCallback(() => {
    isAnimatingRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, [backgroundColor]);

  useEffect(() => {
    return () => {
      stopAnimation();
    };
  }, [stopAnimation]);

  return {
    startAnimation,
    stopAnimation,
  };
};

function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = Math.min(255, Math.max(0, parseInt(hex.substring(0, 2), 16) + amount));
  const g = Math.min(255, Math.max(0, parseInt(hex.substring(2, 4), 16) + amount));
  const b = Math.min(255, Math.max(0, parseInt(hex.substring(4, 6), 16) + amount));
  return `rgb(${r}, ${g}, ${b})`;
}

const audioContextRef = { current: null as AudioContext | null };
