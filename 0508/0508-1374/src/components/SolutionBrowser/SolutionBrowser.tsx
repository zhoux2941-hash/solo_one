import { useAppStore } from '@/store/useAppStore';
import { useExport } from '@/hooks/useExport';
import { ChevronLeft, ChevronRight, Copy, Download, Check, FileText } from 'lucide-react';
import { cn } from '@/utils/cn';

export function SolutionBrowser() {
  const {
    solutions,
    currentSolutionIndex,
    isComplete,
    nextSolution,
    prevSolution,
    goToSolution,
  } = useAppStore();

  const { copyToClipboard, download, copySuccess } = useExport();

  if (solutions.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-amber-500 rounded-full" />
          解决方案
        </h2>
        <div className="text-center py-8 text-slate-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>点击开始运行以生成解决方案</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 space-y-4 border border-slate-700/50">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
        解决方案
      </h2>

      <div className="flex items-center justify-between">
        <button
          onClick={prevSolution}
          disabled={currentSolutionIndex === 0}
          className={cn(
            'p-2 rounded-lg transition-all',
            currentSolutionIndex === 0
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          )}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="text-2xl font-bold text-white font-mono">
            {currentSolutionIndex + 1}
            <span className="text-slate-500 text-lg">/{solutions.length}</span>
          </div>
          <div className="text-xs text-slate-500">
            共 {solutions.length} 个解
          </div>
        </div>

        <button
          onClick={nextSolution}
          disabled={currentSolutionIndex >= solutions.length - 1}
          className={cn(
            'p-2 rounded-lg transition-all',
            currentSolutionIndex >= solutions.length - 1
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          )}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={copyToClipboard}
          className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all flex items-center justify-center gap-2"
        >
          {copySuccess ? (
            <>
              <Check className="w-4 h-4 text-green-400" />
              已复制
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              复制
            </>
          )}
        </button>
        <button
          onClick={download}
          className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-all flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          下载
        </button>
      </div>

      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-2 bg-slate-900/50 rounded-lg">
        {solutions.slice(0, 100).map((_, index) => (
          <button
            key={index}
            onClick={() => goToSolution(index)}
            className={cn(
              'w-7 h-7 text-xs font-mono rounded transition-all',
              currentSolutionIndex === index
                ? 'bg-indigo-500 text-white'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            )}
          >
            {index + 1}
          </button>
        ))}
        {solutions.length > 100 && (
          <div className="flex items-center px-2 text-xs text-slate-500">
            +{solutions.length - 100} 更多
          </div>
        )}
      </div>
    </div>
  );
}
