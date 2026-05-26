import { Trash2, Power, PowerOff, Copy, ExternalLink } from 'lucide-react';
import { MockApiConfig, HttpMethod } from '../../types';
import { getMockApiUrl } from '../../utils/apiService';

interface MockApiItemProps {
  api: MockApiConfig;
  onToggle: () => void;
  onDelete: () => void;
  onCopyUrl: () => void;
}

const methodColors: Record<HttpMethod, string> = {
  GET: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  POST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PUT: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
  PATCH: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export function MockApiItem({ api, onToggle, onDelete, onCopyUrl }: MockApiItemProps) {
  const apiUrl = getMockApiUrl(api.path, api.method);

  return (
    <div className={`p-4 rounded-lg border transition-all ${
      api.isEnabled 
        ? 'bg-slate-800/50 border-slate-600 hover:border-cyan-500/50' 
        : 'bg-slate-800/20 border-slate-700/50 opacity-60'
    }`}>
      <div className="flex items-start gap-3 mb-3">
        <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded border ${methodColors[api.method]}`}>
          {api.method}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white truncate">{api.name}</h4>
          <code className="text-xs text-cyan-400 truncate block">{api.path}</code>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
        <span>状态: {api.statusCode}</span>
        <span>•</span>
        <span>延迟: {api.delay}ms</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
            api.isEnabled
              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
          }`}
        >
          {api.isEnabled ? <Power className="w-3 h-3" /> : <PowerOff className="w-3 h-3" />}
          {api.isEnabled ? '启用' : '禁用'}
        </button>
        
        <button
          onClick={onCopyUrl}
          className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-cyan-400 bg-slate-700/30 hover:bg-slate-700/50 rounded transition-colors"
        >
          <Copy className="w-3 h-3" />
          复制链接
        </button>

        <a
          href={apiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-cyan-400 bg-slate-700/30 hover:bg-slate-700/50 rounded transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          测试
        </a>

        <button
          onClick={onDelete}
          className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-red-400 bg-slate-700/30 hover:bg-red-500/20 rounded transition-colors ml-auto"
        >
          <Trash2 className="w-3 h-3" />
          删除
        </button>
      </div>
    </div>
  );
}
