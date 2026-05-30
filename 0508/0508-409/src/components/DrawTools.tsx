import { Paintbrush, Eraser, Undo2, Trash2, Palette } from 'lucide-react';
import { usePaperCuttingStore } from '../store/usePaperCuttingStore';

const COLORS = [
  { name: '墨黑', value: '#1A1A1A' },
  { name: '中国红', value: '#C41E3A' },
  { name: '藏青', value: '#1E3A5F' },
  { name: '深绿', value: '#1B4D3E' },
  { name: '酱紫', value: '#4A1942' },
  { name: '赭石', value: '#8B4513' },
];

const LINE_WIDTHS = [
  { name: '细', value: 2 },
  { name: '中', value: 4 },
  { name: '粗', value: 6 },
  { name: '特粗', value: 10 },
];

export function DrawTools() {
  const {
    toolSettings,
    setToolSettings,
    clearDrawings,
    undo,
    currentFoldStep,
    drawPaths,
    historyIndex,
    isAnimating,
    isUnfolding,
    showFinalResult,
  } = usePaperCuttingStore();

  const isDisabled = currentFoldStep < 3 || isAnimating || isUnfolding || showFinalResult;
  const canUndo = historyIndex > 0 && !isAnimating && !isUnfolding && !showFinalResult;
  const canClear = drawPaths.length > 0 && !isAnimating && !isUnfolding && !showFinalResult;

  return (
    <div className="flex flex-col gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-chinese-gold/20">
      <h3 className="text-xl font-kai text-chinese-brown text-center border-b border-chinese-gold/30 pb-3 mb-2">
        绘制工具
      </h3>

      <div className="flex gap-2">
        <button
          onClick={() => setToolSettings({ tool: 'brush' })}
          disabled={isDisabled}
          className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg transition-all duration-300 ${
            toolSettings.tool === 'brush' && !isDisabled
              ? 'bg-chinese-red text-paper shadow-button'
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Paintbrush className="w-5 h-5" />
          <span className="text-xs font-song">画笔</span>
        </button>
        <button
          onClick={() => setToolSettings({ tool: 'eraser' })}
          disabled={isDisabled}
          className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg transition-all duration-300 ${
            toolSettings.tool === 'eraser' && !isDisabled
              ? 'bg-chinese-brown text-paper shadow-lg'
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Eraser className="w-5 h-5" />
          <span className="text-xs font-song">橡皮擦</span>
        </button>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-song text-chinese-brown">
          <Palette className="w-4 h-4" />
          线条粗细
        </label>
        <div className="grid grid-cols-4 gap-2">
          {LINE_WIDTHS.map((width) => (
            <button
              key={width.value}
              onClick={() => setToolSettings({ lineWidth: width.value })}
              disabled={isDisabled}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-300 ${
                toolSettings.lineWidth === width.value && !isDisabled
                  ? 'bg-chinese-gold/20 border-2 border-chinese-gold text-chinese-brown'
                  : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100 text-gray-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div
                className="rounded-full bg-current"
                style={{ width: width.value + 4, height: width.value + 4 }}
              />
              <span className="text-xs">{width.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-song text-chinese-brown">
          <Palette className="w-4 h-4" />
          线条颜色
        </label>
        <div className="grid grid-cols-3 gap-2">
          {COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => setToolSettings({ color: color.value })}
              disabled={isDisabled}
              className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-300 ${
                toolSettings.color === color.value && !isDisabled
                  ? 'bg-chinese-gold/20 ring-2 ring-chinese-gold'
                  : 'bg-gray-50 hover:bg-gray-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div
                className="w-5 h-5 rounded-full border-2 border-white shadow"
                style={{ backgroundColor: color.value }}
              />
              <span className="text-xs text-chinese-brown truncate">{color.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-chinese-brown/30 text-chinese-brown hover:bg-chinese-brown/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Undo2 className="w-4 h-4" />
          <span className="font-song text-sm">撤销</span>
        </button>
        <button
          onClick={clearDrawings}
          disabled={!canClear}
          className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-red-300 text-red-600 hover:bg-red-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          <span className="font-song text-sm">清除</span>
        </button>
      </div>

      {isDisabled && currentFoldStep < 3 && (
        <div className="text-center text-sm text-chinese-brown/50 p-3 bg-chinese-brown/5 rounded-lg">
          完成三次折叠后即可绘制
        </div>
      )}

      {!isDisabled && (
        <div className="text-center text-xs text-chinese-brown/60 p-2 bg-paper rounded-lg">
          已绘制 {drawPaths.length} 条线条
        </div>
      )}
    </div>
  );
}
