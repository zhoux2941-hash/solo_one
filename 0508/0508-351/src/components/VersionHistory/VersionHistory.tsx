import React, { useState } from 'react';
import { useScheduleStore, ScheduleVersion } from '../../store/useScheduleStore';
import { Clock, User, ChevronRight, GitCompare, ArrowLeftRight, Plus, Trash2, Edit, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { ScheduleType } from '../../types';

const typeLabels: Record<ScheduleType, string> = {
  'power-off': '断电窗口',
  'sensor-replace': '传感器更换',
  'team-entry': '班组进场',
  'recovery': '旧件回收'
};

const changeTypeConfig = {
  create: { icon: Plus, color: 'text-green-600', bgColor: 'bg-green-50', label: '创建' },
  update: { icon: Edit, color: 'text-blue-600', bgColor: 'bg-blue-50', label: '更新' },
  delete: { icon: Trash2, color: 'text-red-600', bgColor: 'bg-red-50', label: '删除' }
};

const fieldLabels: Record<string, string> = {
  startTime: '开始时间',
  endTime: '结束时间',
  status: '状态',
  title: '标题',
  description: '描述',
  teamId: '班组'
};

interface VersionHistoryProps {
  scheduleId: string;
  onClose: () => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({ scheduleId, onClose }) => {
  const { versions, schedules, compareVersions, selectVersion, selectedVersionId } = useScheduleStore();
  const [compareMode, setCompareMode] = useState(false);
  const [version1Id, setVersion1Id] = useState<string | null>(null);
  const [version2Id, setVersion2Id] = useState<string | null>(null);

  const scheduleVersions = versions
    .filter(v => v.scheduleId === scheduleId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const currentSchedule = schedules.find(s => s.id === scheduleId);

  const handleCompare = () => {
    if (version1Id && version2Id) {
      selectVersion(version2Id);
    }
  };

  const comparisonResult = (version1Id && version2Id) ? compareVersions(version1Id, version2Id) : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[900px] max-h-[80vh] shadow-xl flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="text-blue-600" size={20} />
            <div>
              <h2 className="text-lg font-semibold">版本历史</h2>
              <p className="text-sm text-gray-500">{currentSchedule?.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors',
                compareMode ? 'bg-blue-600 text-white' : 'border hover:bg-gray-50'
              )}
            >
              <GitCompare size={16} />
              对比模式
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {compareMode && (
          <div className="p-4 border-b bg-blue-50">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">选择两个版本进行对比：</span>
              <select
                value={version1Id || ''}
                onChange={(e) => setVersion1Id(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="">选择版本1</option>
                {scheduleVersions.map(v => (
                  <option key={v.id} value={v.id}>
                    {format(new Date(v.timestamp), 'MM-dd HH:mm')} - {v.changeType}
                  </option>
                ))}
              </select>
              <ArrowLeftRight size={16} className="text-gray-400" />
              <select
                value={version2Id || ''}
                onChange={(e) => setVersion2Id(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="">选择版本2</option>
                {scheduleVersions.map(v => (
                  <option key={v.id} value={v.id}>
                    {format(new Date(v.timestamp), 'MM-dd HH:mm')} - {v.changeType}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {comparisonResult && (
          <div className="p-4 border-b bg-yellow-50">
            <h3 className="font-medium text-gray-800 mb-3">版本差异对比</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-lg border">
                <p className="text-xs text-gray-500 mb-2">版本1</p>
                <p className="font-medium">{typeLabels[comparisonResult.schedule1.type]}</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(comparisonResult.schedule1.startTime), 'HH:mm')} - {format(new Date(comparisonResult.schedule1.endTime), 'HH:mm')}
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg border">
                <p className="text-xs text-gray-500 mb-2">版本2</p>
                <p className="font-medium">{typeLabels[comparisonResult.schedule2.type]}</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(comparisonResult.schedule2.startTime), 'HH:mm')} - {format(new Date(comparisonResult.schedule2.endTime), 'HH:mm')}
                </p>
              </div>
            </div>
            {comparisonResult.differences.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">变更内容：</p>
                <div className="space-y-1">
                  {comparisonResult.differences.map((diff, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">{fieldLabels[diff.field] || diff.field}:</span>
                      <span className="text-red-600 line-through">{String(diff.oldValue)}</span>
                      <ChevronRight size={14} className="text-gray-400" />
                      <span className="text-green-600">{String(diff.newValue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {scheduleVersions.map((version, idx) => {
              const config = changeTypeConfig[version.changeType];
              const Icon = config.icon;
              
              return (
                <div
                  key={version.id}
                  className={cn(
                    'p-4 rounded-lg border transition-all',
                    selectedVersionId === version.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', config.bgColor)}>
                      <Icon className={config.color} size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn('text-xs px-2 py-0.5 rounded', config.bgColor, config.color)}>
                          {config.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(version.timestamp), 'yyyy年MM月dd日 HH:mm:ss', { locale: zhCN })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User size={14} className="text-gray-400" />
                        <span>{version.operator}</span>
                      </div>
                      {version.changes.length > 0 && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          {version.changes.map((change, cIdx) => (
                            <div key={cIdx} className="flex items-center gap-1 mb-1 last:mb-0">
                              <span className="text-gray-500">{fieldLabels[change.field] || change.field}:</span>
                              <span className="text-red-500 line-through">{String(change.oldValue)}</span>
                              <ChevronRight size={12} className="text-gray-400" />
                              <span className="text-green-600">{String(change.newValue)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {compareMode && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => setVersion1Id(version.id)}
                          className={cn(
                            'p-1 rounded text-xs',
                            version1Id === version.id ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                          )}
                        >
                          V1
                        </button>
                        <button
                          onClick={() => setVersion2Id(version.id)}
                          className={cn(
                            'p-1 rounded text-xs',
                            version2Id === version.id ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                          )}
                        >
                          V2
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
