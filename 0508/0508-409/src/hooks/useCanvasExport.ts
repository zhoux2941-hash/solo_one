import { useRef } from 'react';
import { CANVAS_SIZE } from '../types';

export function useCanvasExport() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const exportAsImage = (filename: string = 'paper-cutting.png') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const getImageData = (): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.toDataURL('image/png');
  };

  const copyToClipboard = async (): Promise<boolean> => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });

      if (!blob) return false;

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      return true;
    } catch {
      return false;
    }
  };

  return {
    canvasRef,
    exportAsImage,
    getImageData,
    copyToClipboard,
    canvasSize: CANVAS_SIZE,
  };
}
