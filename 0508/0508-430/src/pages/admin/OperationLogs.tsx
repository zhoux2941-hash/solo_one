import { useState, useEffect } from 'react';
import { ScrollText, Filter, Pin, FlaskConical, Trash2, RefreshCw } from 'lucide-react';
import { logsApi } from '../../utils/api.js';
import { OperationLog } from '../../../shared/index.js';

const OPERATION_TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  pin_set: { label: '设置置顶', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: Pin },
  pin_remove: { label: '取消置顶', color: 'text-red-700', bgColor: 'bg-red-100', icon: Trash2 },
  abtest_create: { label: '创建测试', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: FlaskConical },
  abtest_start: { label: '启动测试', color: 'text-green-700', bgColor: 'bg-green-100', icon: FlaskConical },
  abtest_stop: { label: '停止测试', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: FlaskConical },
};

export default function OperationLogs() {
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('');
  const [limit, setLimit] = useState(100);

  useEffect(() => {
    loadData();
  }, [filterType, limit]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await logsApi.getAll(limit, 0, filterType || undefined);
      setLogs(data);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const filteredLogs = filterType
    ? logs.filter(log => log.operationType === filterType)
    : logs;

  if (loading && logs.length === 0) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-48 mb-8"></div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">操作日志</h1>
          <p className="text-gray-500">查看所有配置变更的操作记录</p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Filter className="w-4 h-4" />
          <span>筛选：</span>
        </div>
        <button
          onClick={() => setFilterType('')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            filterType === ''
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          全部
        </button>
        {Object.entries(OPERATION_TYPE_CONFIG).map(([type, config]) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filterType === type
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {filteredLogs.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {filteredLogs.map((log, index) => {
              const typeConfig = OPERATION_TYPE_CONFIG[log.operationType] || {
                label: log.operationType,
                color: 'text-gray-700',
                bgColor: 'bg-gray-100',
                icon: ScrollText
              };
              const TypeIcon = typeConfig.icon;
              return (
                <div key={log.id || index} className="p-5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeConfig.bgColor} ${typeConfig.color}`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${typeConfig.bgColor} ${typeConfig.color}`}>
                          {typeConfig.label}
                        </span>
                        <span className="text-sm text-gray-400">
                          {formatDate(log.timestamp)}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-1">{log.details}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>操作人：{log.operator}</span>
                        {log.targetKeyword && (
                          <span>关键词：<span className="text-blue-500 font-medium">{log.targetKeyword}</span></span>
                        )}
                        {log.targetArticleTitle && (
                          <span className="truncate">文章：{log.targetArticleTitle}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-16 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ScrollText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">暂无操作日志</h3>
            <p className="text-gray-500">当管理员进行配置变更时，操作记录会显示在这里</p>
          </div>
        )}
      </div>

      {filteredLogs.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-400">
          共 {filteredLogs.length} 条记录
        </div>
      )}
    </div>
  );
}
