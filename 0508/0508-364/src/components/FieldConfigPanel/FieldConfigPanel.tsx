import { Plus } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { FieldItem } from './FieldItem';

export function FieldConfigPanel() {
  const { fields, addField } = useAppStore();

  return (
    <div className="h-full flex flex-col bg-slate-900/30">
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">字段配置</h2>
          <span className="text-xs text-slate-400">{fields.length} 个字段</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {fields.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500">
            <p className="text-sm mb-3">暂无字段</p>
            <button
              onClick={addField}
              className="flex items-center gap-2 px-4 py-2 text-sm text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加第一个字段
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {fields.map((field) => (
              <FieldItem key={field.id} field={field} />
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-700/50">
        <button
          onClick={addField}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-500/50 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加字段
        </button>
      </div>
    </div>
  );
}
