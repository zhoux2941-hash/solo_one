import { ArrowLeftRight, Trash2, RotateCcw, Download, Space } from 'lucide-react';
import type { CompareMode } from '../types';

interface ControlBarProps {
  mode: CompareMode;
  ignoreWhitespace: boolean;
  onModeChange: (mode: CompareMode) => void;
  onIgnoreWhitespaceChange: (ignore: boolean) => void;
  onSwap: () => void;
  onClear: () => void;
  onReset: () => void;
  onExport: () => void;
}

export function ControlBar({ mode, ignoreWhitespace, onModeChange, onIgnoreWhitespaceChange, onSwap, onClear, onReset, onExport }: ControlBarProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-gray-900">文本差异对比工具</h1>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onModeChange('char')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              mode === 'char'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            字符级对比
          </button>
          <button
            onClick={() => onModeChange('line')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              mode === 'line'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            行级对比
          </button>
        </div>
        
        <div className="h-6 w-px bg-gray-200"></div>
        
        <button
          onClick={() => onIgnoreWhitespaceChange(!ignoreWhitespace)}
          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
            ignoreWhitespace
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
          title="忽略空白字符"
        >
          <Space size={18} />
          忽略空白
        </button>
        
        <div className="h-6 w-px bg-gray-200"></div>
        
        <button
          onClick={onSwap}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="交换左右文本"
        >
          <ArrowLeftRight size={18} />
          交换
        </button>
        
        <button
          onClick={onClear}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="清空文本"
        >
          <Trash2 size={18} />
          清空
        </button>
        
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="重置"
        >
          <RotateCcw size={18} />
          重置
        </button>
        
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download size={18} />
          导出HTML
        </button>
      </div>
    </div>
  );
}
