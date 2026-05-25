import React, { useState, useMemo } from 'react';
import { useScheduleStore } from '../../store/useScheduleStore';
import { Calendar, Filter, ChevronDown, ChevronRight, MapPin, User, Clock, Plus, Edit, Trash2, History } from 'lucide-react';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { ScheduleType } from '../../types';
import { VersionHistory } from '../VersionHistory/VersionHistory';

const typeLabels: Record<ScheduleType, string> = {
  'power-off': '断电窗口',
  'sensor-replace': '传感器更换',
  'team-entry': '班组进场',
  'recovery': '旧件回收'
};

const typeColors: Record<ScheduleType, string> = {
  'power-off': 'bg-red-100 text-red-700',
  'sensor-replace': 'bg-orange-100 text-orange-700',
  'team-entry': 'bg-green-100 text-green-700',
  'recovery': 'bg-blue-100 text-blue-700'
};

const changeTypeConfig = {
  create: { icon: Plus, color: 'text-green-600', bgColor: 'bg-green-50', label: '创建' },
  update: { icon: Edit, color: 'text-blue-600', bgColor: 'bg-blue-50', label: '更新' },
  delete: { icon: Trash2, color: 'text-red-600', bgColor: 'bg-red-50', label: '删除' }
};

interface GroupedChanges {
  [key: string]: {
    date: Date;
    intervals: {
      [key: string]: {
        line: string;
        changes: any[];
      };
    };
  };
}

export const ChangeTrailView: React.FC = () => {
  const { versions, schedules, workPoints } = useScheduleStore();
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [expandedLines, setExpandedLines] = useState<Set<string>>(new Set());
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const startDate = useMemo(() => startOfDay(subDays(new Date(), 3)), []);
  const endDate = useMemo(() => endOfDay(new Date()), []);

  const filteredVersions = useMemo(() => {
    return versions
      .filter(v => {
        const timestamp = new Date(v.timestamp).getTime();
        if (timestamp < startDate.getTime() || timestamp > endDate.getTime()) return false;
        
        if (filterType !== 'all') {
          const schedule = schedules.find(s => s.id === v.scheduleId);
          if (schedule && schedule.type !== filterType) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [versions, schedules, startDate, endDate, filterType]);

  interface DayGroup {
    date: Date;
    intervals: Record<string, { line: string; changes: any[] }>;
  }

  const groupedChanges = useMemo(() => {
    const groups: Record<string, DayGroup> = {};
    
    filteredVersions.forEach(version => {
      const dayKey = format(new Date(version.timestamp), 'yyyy-MM-dd');
      if (!groups[dayKey]) {
        groups[dayKey] = { date: new Date(version.timestamp), intervals: {} };
      }
      
      const schedule = schedules.find(s => s.id === version.scheduleId) || version.snapshot;
      const workPoint = workPoints.find(wp => wp.id === schedule.workpointId);
      
      if (workPoint) {
        const lineKey = workPoint.line;
        if (!groups[dayKey].intervals[lineKey]) {
          groups[dayKey].intervals[lineKey] = { line: workPoint.line, changes: [] };
        }
        
        groups[dayKey].intervals[lineKey].changes.push({
          ...version,
          workPoint,
          schedule,
          interval: workPoint.position
        });
      }
    });
    
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredVersions, schedules, workPoints]);

  const toggleDay = (dayKey: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(dayKey)) {
        next.delete(dayKey);
      } else {
        next.add(dayKey);
      }
      return next;
    });
  };

  const toggleLine = (lineKey: string) => {
    setExpandedLines(prev => {
      const next = new Set(prev);
      if (next.has(lineKey)) {
        next.delete(lineKey);
      } else {
        next.add(lineKey);
      }
      return next;
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="text-blue-600" size={20} />
            <div>
              <h2 className="text-lg font-semibold">调整痕迹</h2>
              <p className="text-sm text-gray-500">近三天区间对照</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border rounded px-3 py-1.5 text-sm"
            >
              <option value="all">全部类型</option>
              <option value="power-off">断电窗口</option>
              <option value="sensor-replace">传感器更换</option>
              <option value="team-entry">班组进场</option>
              <option value="recovery">旧件回收</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {groupedChanges.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <History size={48} className="mx-auto mb-3 opacity-30" />
            <p>近三天暂无调整记录</p>
          </div>
        ) : (
          (groupedChanges as [string, DayGroup][]).map(([dayKey, dayData]) => (
            <div key={dayKey} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleDay(dayKey)}
                className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedDays.has(dayKey) ? (
                    <ChevronDown size={18} className="text-gray-500" />
                  ) : (
                    <ChevronRight size={18} className="text-gray-500" />
                  )}
                  <Calendar size={16} className="text-blue-500" />
                  <span className="font-medium">
                    {format(dayData.date, 'yyyy年MM月dd日', { locale: zhCN })}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({Object.keys(dayData.intervals).length} 条线路)
                  </span>
                </div>
              </button>

              {expandedDays.has(dayKey) && (
                <div className="p-4 space-y-3">
                  {Object.entries(dayData.intervals)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([lineKey, lineData]: [string, { line: string; changes: any[] }]) => (
                      <div key={lineKey} className="border rounded overflow-hidden">
                        <button
                          onClick={() => toggleLine(`${dayKey}-${lineKey}`)}
                          className="w-full p-3 flex items-center justify-between bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {expandedLines.has(`${dayKey}-${lineKey}`) ? (
                              <ChevronDown size={16} className="text-gray-500" />
                            ) : (
                              <ChevronRight size={16} className="text-gray-500" />
                            )}
                            <span className="font-medium text-sm">{lineData.line}</span>
                            <span className="text-xs text-gray-500">
                              ({lineData.changes.length} 处调整)
                            </span>
                          </div>
                        </button>

                        {expandedLines.has(`${dayKey}-${lineKey}`) && (
                          <div className="p-3">
                            <div className="space-y-2">
                              {lineData.changes
                                .sort((a: any, b: any) => a.interval - b.interval)
                                .map((change: any) => {
                                  const config = changeTypeConfig[change.changeType];
                                  const ChangeIcon = config.icon;
                                  
                                  return (
                                    <div
                                      key={change.id}
                                      className="flex items-center gap-3 p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                                      onClick={() => setSelectedScheduleId(change.scheduleId)}
                                    >
                                      <div className={cn('w-8 h-8 rounded flex items-center justify-center', config.bgColor)}>
                                        <ChangeIcon className={config.color} size={14} />
                                      </div>
                                      
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <MapPin size={14} className="text-gray-400" />
                                          <span className="text-sm font-medium">
                                            {change.workPoint.name}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            区间 {change.interval}
                                          </span>
                                          <span className={cn('text-xs px-2 py-0.5 rounded', typeColors[change.schedule?.type || change.snapshot.type])}>
                                            {typeLabels[change.schedule?.type || change.snapshot.type]}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                          <span className="flex items-center gap-1">
                                            <Clock size={12} />
                                            {format(new Date(change.timestamp), 'HH:mm:ss')}
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <User size={12} />
                                            {change.operator}
                                          </span>
                                        </div>
                                        {change.changes && change.changes.length > 0 && (
                                          <div className="mt-1 text-xs text-gray-600">
                                            {change.changes.length} 项变更
                                          </div>
                                        )}
                                      </div>
                                      
                                      <ChevronRight size={16} className="text-gray-300" />
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {selectedScheduleId && (
        <VersionHistory
          scheduleId={selectedScheduleId}
          onClose={() => setSelectedScheduleId(null)}
        />
      )}
    </div>
  );
};
