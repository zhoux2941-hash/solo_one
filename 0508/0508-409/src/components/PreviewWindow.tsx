import { useRef, useEffect } from 'react';
import { Eye } from 'lucide-react';
import { usePaperCuttingStore } from '../store/usePaperCuttingStore';
import { PREVIEW_SIZE, CANVAS_SIZE } from '../types';
import { renderFullScene } from '../utils/paperRenderer';
import { getTotalLayers } from '../utils/geometry';

export function PreviewWindow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { drawPaths, currentFoldStep, currentPath, isUnfolding, unfoldProgress, showFinalResult } = usePaperCuttingStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);

    ctx.save();
    ctx.scale(PREVIEW_SIZE / CANVAS_SIZE, PREVIEW_SIZE / CANVAS_SIZE);

    if (currentFoldStep < 3 && !showFinalResult) {
      renderFullScene(ctx, currentFoldStep, [], null, false, 0, false);

      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#3D2914';
      ctx.font = '24px "Noto Serif SC", serif';
      ctx.textAlign = 'center';
      ctx.fillText('完成折叠后', 300, 280);
      ctx.fillText('显示预览', 300, 320);
    } else {
      renderFullScene(ctx, 3, drawPaths, currentPath, isUnfolding, unfoldProgress, showFinalResult);

      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(2, 2, 596, 596);
    }

    ctx.restore();
  }, [drawPaths, currentFoldStep, currentPath, isUnfolding, unfoldProgress, showFinalResult]);

  const totalLayers = currentFoldStep >= 3 ? getTotalLayers(currentFoldStep) : 0;
  const drawnCount = drawPaths.length;

  return (
    <div className="flex flex-col gap-3 p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-chinese-gold/20">
      <div className="flex items-center justify-center gap-2 pb-2 border-b border-chinese-gold/30">
        <Eye className="w-4 h-4 text-chinese-gold" />
        <h3 className="text-sm font-kai text-chinese-brown">效果预览</h3>
      </div>

      <div className="relative">
        <div
          className="rounded-lg overflow-hidden shadow-md"
          style={{
            width: PREVIEW_SIZE,
            height: PREVIEW_SIZE,
          }}
        >
          <canvas
            ref={canvasRef}
            width={PREVIEW_SIZE}
            height={PREVIEW_SIZE}
            className="w-full h-full"
          />
        </div>

        {currentFoldStep >= 3 && drawnCount === 0 && !showFinalResult && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-chinese-brown/70 text-paper px-3 py-2 rounded-lg text-xs font-song">
              绘制后查看效果
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-chinese-brown/60 font-song space-y-1">
        {totalLayers > 0 ? (
          <>
            <div>
              对称层数：<span className="font-bold text-chinese-red">{totalLayers}</span> 层
              <span className="text-chinese-brown/40 ml-1">（2^{currentFoldStep} = {totalLayers}）</span>
            </div>
            <div>
              已绘制 <span className="font-bold">{drawnCount}</span> 条线条 →
              展开后 <span className="font-bold text-chinese-red">{drawnCount * totalLayers}</span> 条
            </div>
          </>
        ) : (
          <div>完成折叠后显示对称效果</div>
        )}
      </div>
    </div>
  );
}
