import { Copy, Download, RotateCcw, Trash2, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { copyToClipboard, exportToJson } from '../utils/exportUtils';

export function Header() {
  const { generatedData, clearFields, resetFields, isGenerating } = useAppStore();

  const handleCopy = async () => {
    if (generatedData.length > 0) {
      const success = await copyToClipboard(generatedData);
      if (success) {
        alert('已复制到剪贴板');
      }
    }
  };

  const handleExport = () => {
    if (generatedData.length > 0) {
      exportToJson(generatedData);
    }
  };

  return (
    <header className="h-16 px-6 flex items-center justify-between bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">JSON Mock Generator</h1>
          <p className="text-xs text-slate-400">可视化模拟数据生成工具</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={clearFields}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>清空</span>
        </button>
        <button
          onClick={resetFields}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>重置</span>
        </button>
        <div className="w-px h-6 bg-slate-700 mx-2" />
        <button
          onClick={handleCopy}
          disabled={generatedData.length === 0 || isGenerating}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <Copy className="w-4 h-4" />
          <span>复制</span>
        </button>
        <button
          onClick={handleExport}
          disabled={generatedData.length === 0 || isGenerating}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all shadow-lg shadow-cyan-500/25"
        >
          <Download className="w-4 h-4" />
          <span>导出 JSON</span>
        </button>
      </div>
    </header>
  );
}
