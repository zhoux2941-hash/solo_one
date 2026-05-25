import React from 'react';
import { useScheduleStore } from '../../store/useScheduleStore';
import { Conflict, ConflictType, ConflictSeverity } from '../../types';
import { AlertTriangle, AlertCircle, X, Clock, Users, ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils';

const typeConfig: Record<ConflictType, { icon: React.ReactNode; label: string }> = {
  'time-overlap': { icon: <Clock size={14} />, label: '时间重叠' },
  'resource-conflict': { icon: <Users size={14} />, label: '资源冲突' },
  'safety-violation': { icon: <ShieldAlert size={14} />, label: '安全违规' }
};

const severityConfig: Record<ConflictSeverity, { bgColor: string; textColor: string; borderColor: string }> = {
  warning: { bgColor: 'bg-yellow-50', textColor: 'text-yellow-800', borderColor: 'border-yellow-200' },
  critical: { bgColor: 'bg-red-50', textColor: 'text-red-800', borderColor: 'border-red-200' }
};

export const ConflictAlert: React.FC = () => {
  const { conflicts, schedules, selectSchedule } = useScheduleStore();

  const getScheduleTitle = (scheduleId: string) => {
    return schedules.find(s => s.id === scheduleId)?.title || '未知任务';
  };

  const handleClick = (conflict: Conflict) => {
    const schedule = schedules.find(s => s.id === conflict.scheduleId1);
    if (schedule) {
      selectSchedule(schedule);
    }
  };

  if (conflicts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle size={20} className="text-green-600" />
          冲突告警
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <AlertCircle size={48} className="mb-2 text-green-400" />
          <p className="text-sm">当前无冲突</p>
          <p className="text-xs">所有作业安排正常</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <AlertTriangle size={20} className="text-red-600" />
        冲突告警
        <span className="ml-auto text-sm font-normal bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
          {conflicts.length} 个冲突
        </span>
      </h3>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {conflicts.map(conflict => (
          <div
            key={conflict.id}
            className={cn(
              'p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md',
              severityConfig[conflict.severity].bgColor,
              severityConfig[conflict.severity].borderColor
            )}
            onClick={() => handleClick(conflict)}
          >
            <div className="flex items-start gap-2">
              <div className={cn('flex-shrink-0 mt-0.5', severityConfig[conflict.severity].textColor)}>
                {typeConfig[conflict.type].icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn('text-xs font-medium', severityConfig[conflict.severity].textColor)}>
                    {typeConfig[conflict.type].label}
                  </span>
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded',
                    conflict.severity === 'critical' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                  )}>
                    {conflict.severity === 'critical' ? '严重' : '警告'}
                  </span>
                </div>
                <p className={cn('text-sm mt-1', severityConfig[conflict.severity].textColor)}>
                  {conflict.description}
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  <span className="font-medium">涉及任务：</span>
                  {getScheduleTitle(conflict.scheduleId1)} → {getScheduleTitle(conflict.scheduleId2)}
                </div>
              </div>
              <X size={14} className="flex-shrink-0 text-gray-400 hover:text-gray-600" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
