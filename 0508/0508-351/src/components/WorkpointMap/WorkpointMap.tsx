import React from 'react';
import { useScheduleStore } from '../../store/useScheduleStore';
import { WorkPointStatus } from '../../types';
import { MapPin, Circle, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

const statusConfig: Record<WorkPointStatus, { color: string; label: string }> = {
  normal: { color: 'bg-green-500', label: '正常' },
  maintenance: { color: 'bg-yellow-500', label: '维护中' },
  offline: { color: 'bg-red-500', label: '离线' }
};

export const WorkpointMap: React.FC = () => {
  const { workPoints, schedules, selectWorkPoint, selectedWorkPoint, conflicts } = useScheduleStore();

  const lines = [...new Set(workPoints.map(wp => wp.line))].sort();

  const hasConflict = (workpointId: string) => {
    return conflicts.some(c => {
      const s1 = schedules.find(s => s.id === c.scheduleId1);
      const s2 = schedules.find(s => s.id === c.scheduleId2);
      return s1?.workpointId === workpointId || s2?.workpointId === workpointId;
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <MapPin size={20} className="text-blue-600" />
        工点地图
      </h3>

      {lines.map(line => (
        <div key={line} className="mb-6 last:mb-0">
          <div className="text-sm font-medium text-gray-600 mb-2">{line}</div>
          <div className="relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 rounded-full" />
            
            <div className="relative flex justify-between px-2">
              {workPoints
                .filter(wp => wp.line === line)
                .sort((a, b) => a.position - b.position)
                .map(workPoint => (
                  <button
                    key={workPoint.id}
                    onClick={() => selectWorkPoint(selectedWorkPoint?.id === workPoint.id ? null : workPoint)}
                    className={cn(
                      'relative flex flex-col items-center group',
                      'transition-all duration-200 hover:scale-110'
                    )}
                  >
                    <div className="relative">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-md',
                          statusConfig[workPoint.status].color,
                          selectedWorkPoint?.id === workPoint.id && 'ring-4 ring-blue-300',
                          hasConflict(workPoint.id) && 'animate-pulse'
                        )}
                      >
                        <Circle size={14} className="text-white" fill="white" />
                      </div>
                      
                      {hasConflict(workPoint.id) && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <AlertTriangle size={10} className="text-white" />
                        </div>
                      )}
                    </div>
                    
                    <span className="mt-2 text-xs font-medium text-gray-700 whitespace-nowrap">
                      {workPoint.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {statusConfig[workPoint.status].label}
                    </span>

                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                        {workPoint.name} - {statusConfig[workPoint.status].label}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      ))}

      <div className="mt-4 pt-4 border-t flex gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>正常</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>维护中</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>离线</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <span>有冲突</span>
        </div>
      </div>
    </div>
  );
};
