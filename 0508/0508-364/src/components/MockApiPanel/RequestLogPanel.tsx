import { useEffect } from 'react';
import { X, Trash2, Clock, RefreshCw } from 'lucide-react';
import { useMockApiStore } from '../../store/useMockApiStore';
import { RequestLog, HttpMethod } from '../../types';

const methodColors: Record<HttpMethod, string> = {
  GET: 'bg-emerald-500/20 text-emerald-400',
  POST: 'bg-blue-500/20 text-blue-400',
  PUT: 'bg-amber-500/20 text-amber-400',
  DELETE: 'bg-red-500/20 text-red-400',
  PATCH: 'bg-purple-500/20 text-purple-400',
};

function getStatusColor(code: number): string {
  if (code >= 200 && code < 300) return 'text-emerald-400';
  if (code >= 300 && code < 400) return 'text-amber-400';
  if (code >= 400 && code < 500) return 'text-orange-400';
  return 'text-red-400';
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

interface RequestLogItemProps {
  log: RequestLog;
}

function RequestLogItem({ log }: RequestLogItemProps) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 hover:bg-slate-800/50 border-b border-slate-700/50 last:border-0">
      <span className="text-xs text-slate-500 w-16 flex-shrink-0">
        {formatTime(log.timestamp)}
      </span>
      <span className={`px-1.5 py-0.5 text-xs font-mono font-bold rounded ${methodColors[log.method]}`}
        style={{ minWidth: '50px', textAlign: 'center' }}>
        {log.method}
      </span>
      <span className={`text-xs font-mono ${getStatusColor(log.statusCode)} w-8 flex-shrink-0`}>
        {log.statusCode}
      </span>
      <span className="flex-1 text-xs text-slate-300 font-mono truncate">
        {log.path}
      </span>
      <span className="text-xs text-slate-500 w-12 flex-shrink-0 text-right">
        {log.responseTime}ms
      </span>
    </div>
  );
}

interface RequestLogPanelProps {
  onClose: () => void;
}

export function RequestLogPanel({ onClose }: RequestLogPanelProps) {
  const { logs, isLogsLoading, loadLogs, clearLogs } = useMockApiStore();

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 2000);
    return () => clearInterval(interval);
  }, [loadLogs]);

  return (
    <div className="h-full flex flex-col bg-slate-900">
      <div className="flex items-center justify-between p-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-medium text-slate-200">请求日志</h3>
          {logs.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full">
              {logs.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={loadLogs}
            disabled={isLogsLoading}
            className="p-1.5 hover:bg-slate-700/50 rounded transition-colors"
            title="刷新"
          >
            <RefreshCw className={`w-4 h-4 text-slate-400 ${isLogsLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={clearLogs}
            className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
            title="清空日志"
          >
            <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-400" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-700/50 rounded transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500">
            <Clock className="w-10 h-10 mb-2 text-slate-600" />
            <p className="text-sm">暂无请求日志</p>
          </div>
        ) : (
          <div>
            {logs.map((log) => (
              <RequestLogItem key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
