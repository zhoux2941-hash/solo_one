import { useState, useEffect } from 'react';
import { Plus, Server, ServerOff, RefreshCw, Globe, Terminal } from 'lucide-react';
import { useMockApiStore } from '../../store/useMockApiStore';
import { HttpMethod } from '../../types';
import { MockApiItem } from './MockApiItem';
import { MockApiForm } from './MockApiForm';
import { getMockApiUrl } from '../../utils/apiService';

export function MockApiPanel() {
  const { apis, isLoading, isServerOnline, logsPanelOpen, loadApis, createApi, deleteApi, toggleApi, checkServerHealth, setLogsPanelOpen } = useMockApiStore();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    checkServerHealth();
    loadApis();
  }, [checkServerHealth, loadApis]);

  const handleCreateApi = async (data: { 
    name: string; 
    method: HttpMethod; 
    path: string; 
    delay: number; 
    statusCode: number; 
    responseData: any 
  }) => {
    try {
      await createApi(data);
      setShowForm(false);
    } catch (error) {
      alert('创建API失败，请确保Mock Server正在运行');
    }
  };

  const handleCopyUrl = async (path: string, method: HttpMethod) => {
    const url = getMockApiUrl(path, method);
    try {
      await navigator.clipboard.writeText(url);
      alert('已复制到剪贴板');
    } catch {
      alert('复制失败');
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900/30">
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-200">Mock Server</h2>
              <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                isServerOnline 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {isServerOnline ? <Server className="w-3 h-3" /> : <ServerOff className="w-3 h-3" />}
                {isServerOnline ? '运行中' : '未连接'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => loadApis()}
                disabled={isLoading}
                className="p-1.5 hover:bg-slate-700/50 rounded-md transition-colors disabled:opacity-50"
                title="刷新"
              >
                <RefreshCw className={`w-4 h-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setLogsPanelOpen(!logsPanelOpen)}
                className={`p-1.5 rounded-md transition-colors ${
                  logsPanelOpen ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-slate-700/50 text-slate-400'
                }`}
                title="请求日志"
              >
                <Terminal className="w-4 h-4" />
              </button>
            </div>
          </div>

        {isServerOnline && (
          <div className="text-xs text-slate-500 mb-3">
            <span className="text-slate-400">服务地址:</span> http://localhost:3001/mock/*
          </div>
        )}

        <button
          onClick={() => setShowForm(true)}
          disabled={!isServerOnline}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all shadow-lg shadow-cyan-500/25"
        >
          <Plus className="w-4 h-4" />
          创建 Mock API
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!isServerOnline ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500">
            <ServerOff className="w-12 h-12 mb-3 text-slate-600" />
            <p className="text-sm mb-2">Mock Server 未运行</p>
            <p className="text-xs text-slate-600">请确保后端服务已启动</p>
          </div>
        ) : apis.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500">
            <Globe className="w-12 h-12 mb-3 text-slate-600" />
            <p className="text-sm mb-2">暂无 Mock API</p>
            <p className="text-xs text-slate-600">点击上方按钮创建第一个API</p>
          </div>
        ) : (
          <div className="space-y-3">
            {apis.map((api) => (
              <MockApiItem
                key={api.id}
                api={api}
                onToggle={() => toggleApi(api.id)}
                onDelete={() => deleteApi(api.id)}
                onCopyUrl={() => handleCopyUrl(api.path, api.method)}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <MockApiForm
          onSubmit={handleCreateApi}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
