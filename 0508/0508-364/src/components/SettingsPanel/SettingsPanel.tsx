import { Wand2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { TemplatePanel } from '../TemplatePanel/TemplatePanel';
import { DataCountSlider } from './DataCountSlider';

export function SettingsPanel() {
  const { generateData, isGenerating, fields } = useAppStore();

  return (
    <div className="h-full flex flex-col bg-slate-900/30 p-4 overflow-y-auto">
      <TemplatePanel />

      <div className="border-t border-slate-700/50 pt-4">
        <DataCountSlider />
      </div>

      <div className="mt-auto pt-4">
        <button
          onClick={generateData}
          disabled={isGenerating || fields.length === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
        >
          <Wand2 className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? '生成中...' : '生成数据'}
        </button>
      </div>

      <div className="mt-4 p-3 bg-slate-800/30 rounded-lg">
        <h4 className="text-xs font-medium text-slate-400 mb-2">💡 提示</h4>
        <ul className="text-xs text-slate-500 space-y-1">
          <li>• 支持最多3层嵌套对象/数组</li>
          <li>• 配置会自动保存到本地</li>
          <li>• 点击对象/数组可添加子字段</li>
        </ul>
      </div>
    </div>
  );
}
