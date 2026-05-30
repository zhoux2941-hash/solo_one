import { useEffect, useRef } from 'react';
import { usePaperCuttingStore } from '../store/usePaperCuttingStore';
import { useCanvasRender } from '../hooks/useCanvasRender';
import { CANVAS_SIZE } from '../types';
import { useCanvasExport } from '../hooks/useCanvasExport';

export function PaperCanvas() {
  const {
    currentFoldStep,
    drawPaths,
    currentPath,
    isUnfolding,
    unfoldProgress,
    showFinalResult,
    isAnimating,
    startDrawing,
    continueDrawing,
    endDrawing,
    isDrawing,
  } = usePaperCuttingStore();

  const containerRef = useRef<HTMLDivElement>(null);

  const {
    canvasRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useCanvasRender({
    currentFoldStep,
    drawPaths,
    currentPath,
    isUnfolding,
    unfoldProgress,
    showFinalResult,
    isAnimating,
    onMouseDown: startDrawing,
    onMouseMove: continueDrawing,
    onMouseUp: endDrawing,
    onMouseLeave: () => {
      if (isDrawing) {
        endDrawing();
      }
    },
  });

  const { canvasRef: exportRef } = useCanvasExport();

  useEffect(() => {
    if (exportRef.current && canvasRef.current) {
      const exportCtx = exportRef.current.getContext('2d');
      const sourceCtx = canvasRef.current.getContext('2d');
      if (exportCtx && sourceCtx) {
        exportCtx.drawImage(canvasRef.current, 0, 0);
      }
    }
  }, [drawPaths, currentPath, showFinalResult, isUnfolding, unfoldProgress, canvasRef, exportRef]);

  const canDraw = currentFoldStep >= 3 && !isAnimating && !isUnfolding && !showFinalResult;

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={containerRef}
        className="relative"
        style={{
          width: '100%',
          maxWidth: CANVAS_SIZE,
          aspectRatio: '1 / 1',
        }}
      >
        <div
          className={`absolute inset-0 rounded-lg overflow-hidden transition-all duration-300 ${
            isAnimating && !isUnfolding ? 'animate-fold-in' : ''
          } ${showFinalResult ? 'animate-unfold' : ''}`}
          style={{
            boxShadow: '0 8px 32px rgba(61, 41, 20, 0.2), 0 2px 8px rgba(61, 41, 20, 0.1)',
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className={`w-full h-full ${canDraw ? 'canvas-cursor-brush' : 'cursor-not-allowed'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        </div>

        {!canDraw && currentFoldStep < 3 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-chinese-brown/80 text-paper px-6 py-3 rounded-full text-lg font-kai shadow-lg animate-float">
              请先完成三次折叠
            </div>
          </div>
        )}

        {currentFoldStep >= 3 && !showFinalResult && !isUnfolding && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-none">
            <div className="bg-chinese-gold/90 text-chinese-brown px-4 py-2 rounded-full text-sm font-song shadow-lg">
              ✏️ 在三角形区域绘制裁剪图案
            </div>
          </div>
        )}
      </div>

      <canvas
        ref={exportRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="hidden"
      />
    </div>
  );
}
