import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { MockApiConfig, HttpMethod } from '../../types';
import { useAppStore } from '../../store/useAppStore';

interface MockApiFormProps {
  onSubmit: (data: { name: string; method: HttpMethod; path: string; delay: number; statusCode: number; responseData: any }) => void;
  onCancel: () => void;
  initialData?: MockApiConfig;
}

const httpMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

const statusCodePresets = [
  { code: 200, label: '200 OK', color: 'bg-emerald-500/20 text-emerald-400' },
  { code: 201, label: '201 Created', color: 'bg-emerald-500/20 text-emerald-400' },
  { code: 204, label: '204 No Content', color: 'bg-emerald-500/20 text-emerald-400' },
  { code: 400, label: '400 Bad Request', color: 'bg-amber-500/20 text-amber-400' },
  { code: 401, label: '401 Unauthorized', color: 'bg-amber-500/20 text-amber-400' },
  { code: 403, label: '403 Forbidden', color: 'bg-amber-500/20 text-amber-400' },
  { code: 404, label: '404 Not Found', color: 'bg-orange-500/20 text-orange-400' },
  { code: 500, label: '500 Server Error', color: 'bg-red-500/20 text-red-400' },
  { code: 502, label: '502 Bad Gateway', color: 'bg-red-500/20 text-red-400' },
  { code: 503, label: '503 Unavailable', color: 'bg-red-500/20 text-red-400' },
];

const delayPresets = [
  { value: 0, label: '无延迟' },
  { value: 100, label: '100ms' },
  { value: 300, label: '300ms' },
  { value: 500, label: '500ms' },
  { value: 1000, label: '1s' },
  { value: 2000, label: '2s' },
  { value: 3000, label: '3s' },
];

export function MockApiForm({ onSubmit, onCancel, initialData }: MockApiFormProps) {
  const { generatedData, fields } = useAppStore();
  const [name, setName] = useState(initialData?.name || '');
  const [method, setMethod] = useState<HttpMethod>(initialData?.method || 'GET');
  const [path, setPath] = useState(initialData?.path || '/api/example');
  const [delay, setDelay] = useState(initialData?.delay ?? 0);
  const [statusCode, setStatusCode] = useState(initialData?.statusCode ?? 200);
  const [useGeneratedData, setUseGeneratedData] = useState(true);

  useEffect(() => {
    if (!initialData && fields.length > 0) {
      setName(fields[0]?.name ? `${fields[0].name}列表` : 'Mock API');
    }
  }, [initialData, fields]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      method,
      path,
      delay,
      statusCode,
      responseData: useGeneratedData && generatedData.length > 0 ? generatedData : initialData?.responseData || {}
    });
  };

  const methodColors: Record<HttpMethod, string> = {
    GET: 'bg-emerald-500/20 text-emerald-400',
    POST: 'bg-blue-500/20 text-blue-400',
    PUT: 'bg-amber-500/20 text-amber-400',
    DELETE: 'bg-red-500/20 text-red-400',
    PATCH: 'bg-purple-500/20 text-purple-400',
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-700">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">
            {initialData ? '编辑Mock API' : '创建Mock API'}
          </h3>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-slate-700 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">API 名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="用户列表接口"
              className="w-full h-10 px-3 rounded-md bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">HTTP 方法</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as HttpMethod)}
                className="w-full h-10 px-3 rounded-md bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                {httpMethods.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">状态码</label>
              <input
                type="number"
                value={statusCode}
                onChange={(e) => setStatusCode(Number(e.target.value))}
                min={100}
                max={599}
                className="w-full h-10 px-3 rounded-md bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {statusCodePresets.map((preset) => (
                  <button
                    key={preset.code}
                    type="button"
                    onClick={() => setStatusCode(preset.code)}
                    className={`px-2 py-0.5 text-xs rounded transition-colors ${
                      statusCode === preset.code
                        ? preset.color + ' border border-current'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {preset.code}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">接口路径</label>
            <div className="flex items-center">
              <span className="px-3 py-2 bg-slate-700/50 border border-slate-600 border-r-0 rounded-l-md text-slate-400 text-sm">
                /mock
              </span>
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/api/users"
                className="flex-1 h-10 px-3 rounded-r-md bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              响应延迟: {delay}ms
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {delayPresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setDelay(preset.value)}
                  className={`px-2 py-0.5 text-xs rounded transition-colors ${
                    delay === preset.value
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                      : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <input
              type="range"
              value={delay}
              onChange={(e) => setDelay(Number(e.target.value))}
              min={0}
              max={5000}
              step={100}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0ms</span>
              <span>5000ms</span>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={useGeneratedData}
                onChange={(e) => setUseGeneratedData(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-cyan-500"
              />
              <span className="text-sm text-slate-300">使用当前生成的数据作为响应</span>
            </label>
            {useGeneratedData && generatedData.length > 0 && (
              <div className="text-xs text-emerald-400">
                ✓ 将使用 {generatedData.length} 条数据作为响应
              </div>
            )}
            {useGeneratedData && generatedData.length === 0 && (
              <div className="text-xs text-amber-400">
                ⚠ 暂无生成的数据，请先点击「生成数据」
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-sm text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-md transition-all"
            >
              {initialData ? '保存修改' : '创建API'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
