import { Sparkles, Download, RotateCcw } from 'lucide-react';
import { usePaperCuttingStore } from '../store/usePaperCuttingStore';
import { useUnfoldAnimation } from '../hooks/useUnfoldAnimation';
import { useCanvasExport } from '../hooks/useCanvasExport';
import { useState } from 'react';

export function UnfoldButton() {
  const {
    currentFoldStep,
    drawPaths,
    unfold,
    reset,
    isAnimating,
    isUnfolding,
    showFinalResult,
  } = usePaperCuttingStore();

  const { exportAsImage } = useCanvasExport();
  const [copied, setCopied] = useState(false);

  useUnfoldAnimation();

  const canUnfold = currentFoldStep >= 3 && drawPaths.length > 0 && !isAnimating && !isUnfolding && !showFinalResult;
  const isLoading = isUnfolding || (isAnimating && !showFinalResult);

  const handleExport = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    exportAsImage(`剪纸作品-${timestamp}.png`);
  };

  const handleCopy = async () => {
    const canvas = document.querySelector('canvas:not(.hidden)') as HTMLCanvasElement;
    if (!canvas) return;

    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });

      if (!blob) return;

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('复制失败');
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {!showFinalResult ? (
        <button
          onClick={unfold}
          disabled={!canUnfold || isLoading}
          className={`relative flex items-center gap-3 px-10 py-4 rounded-xl text-xl font-kai transition-all duration-300 ${
            canUnfold && !isLoading
              ? 'btn-chinese animate-pulse-gold cursor-pointer text-lg shadow-button-hover'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed border-2 border-gray-400'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-6 h-6 border-2 border-paper border-t-transparent rounded-full animate-spin" />
              <span>展开中...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-6 h-6" />
              <span>展 开 作 品</span>
              <Sparkles className="w-6 h-6" />
            </>
          )}

          {canUnfold && !isLoading && (
            <div className="absolute -top-2 -right-2 bg-chinese-gold text-chinese-brown text-xs px-2 py-1 rounded-full font-bold animate-bounce">
              NEW
            </div>
          )}
        </button>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="text-center mb-2">
            <h3 className="text-2xl font-kai text-chinese-brown mb-1">🎊 作品完成 🎊</h3>
            <p className="text-sm text-chinese-brown/70 font-song">
              您的精美剪纸作品已经展开，共 {drawPaths.length} 条裁剪线条
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-3 rounded-lg btn-chinese shadow-button hover:shadow-button-hover"
            >
              <Download className="w-5 h-5" />
              <span className="font-song">下载图片</span>
            </button>

            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all duration-300 ${
                copied
                  ? 'bg-green-500 text-white border-green-600'
                  : 'bg-white text-chinese-brown border-chinese-gold hover:bg-chinese-gold/10'
              }`}
            >
              {copied ? (
                <span className="font-song">✓ 已复制</span>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="font-song">复制图片</span>
                </>
              )}
            </button>

            <button
              onClick={reset}
              className="flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-chinese-brown/30 text-chinese-brown hover:bg-chinese-brown/10 transition-all duration-300"
            >
              <RotateCcw className="w-5 h-5" />
              <span className="font-song">重新创作</span>
            </button>
          </div>
        </div>
      )}

      {!showFinalResult && !canUnfold && currentFoldStep < 3 && (
        <p className="text-sm text-chinese-brown/50 font-song">
          完成 {3 - currentFoldStep} 次折叠并绘制图案后即可展开
        </p>
      )}

      {!showFinalResult && !canUnfold && currentFoldStep >= 3 && drawPaths.length === 0 && (
        <p className="text-sm text-chinese-brown/50 font-song">
          请在折叠好的纸上绘制裁剪图案
        </p>
      )}
    </div>
  );
}
