import { useAppStore } from '../../store/useAppStore';
import { JsonViewer } from './JsonViewer';
import { Loader2 } from 'lucide-react';

export function PreviewPanel() {
  const { generatedData, isGenerating } = useAppStore();

  return (
    <div className="h-full flex flex-col bg-slate-950/50">
      <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-200">数据预览</h2>
          {generatedData.length > 0 && (
            <span className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full">
              {generatedData.length} 条
            </span>
          )}
        </div>
        {isGenerating && (
          <div className="flex items-center gap-2 text-xs text-cyan-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            生成中...
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
        <JsonViewer data={generatedData} />
      </div>
    </div>
  );
}
