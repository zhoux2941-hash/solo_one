import React, { useState } from 'react';
import { useScheduleStore } from '../store/useScheduleStore';
import { Timeline } from '../components/Timeline/Timeline';
import { WorkpointMap } from '../components/WorkpointMap/WorkpointMap';
import { ConflictAlert } from '../components/ConflictAlert/ConflictAlert';
import { ScheduleDetail } from '../components/ScheduleDetail/ScheduleDetail';
import { ChangeTrailView } from '../components/ChangeTrailView/ChangeTrailView';
import { VersionHistory } from '../components/VersionHistory/VersionHistory';
import { Zap, Wrench, Users, Recycle, Plus, Calendar, Clock, GitCompare, LayoutGrid, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '../lib/utils';

type ViewMode = 'schedule' | 'trail';

export const Home: React.FC = () => {
  const { workPoints, schedules, conflicts, selectedSchedule } = useScheduleStore();
  const [viewMode, setViewMode] = useState<ViewMode>('schedule');

  const today = new Date();

  const stats = {
    total: schedules.length,
    powerOff: schedules.filter(s => s.type === 'power-off').length,
    sensorReplace: schedules.filter(s => s.type === 'sensor-replace').length,
    teamEntry: schedules.filter(s => s.type === 'team-entry').length,
    recovery: schedules.filter(s => s.type === 'recovery').length,
    conflicts: conflicts.length
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">联排台</h1>
            <p className="text-sm text-gray-500">
              {format(today, 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-gray-500" />
              <input
                type="date"
                defaultValue={format(today, 'yyyy-MM-dd')}
                className="border rounded px-2 py-1 text-sm"
              />
            </div>
            {viewMode === 'schedule' && (
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                <Plus size={16} />
                新增任务
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
              <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center">
                <span className="text-sm font-bold text-gray-600">{stats.total}</span>
              </div>
              <div>
                <p className="text-xs text-gray-500">总任务</p>
                <p className="text-sm font-medium">{stats.total} 项</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-lg">
              <div className="w-8 h-8 rounded bg-amber-100 flex items-center justify-center">
                <Zap size={16} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">断电窗口</p>
                <p className="text-sm font-medium">{stats.powerOff} 个</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
                <Wrench size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">传感器更换</p>
                <p className="text-sm font-medium">{stats.sensorReplace} 项</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg">
              <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center">
                <Users size={16} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">班组进场</p>
                <p className="text-sm font-medium">{stats.teamEntry} 次</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-lg">
              <div className="w-8 h-8 rounded bg-purple-100 flex items-center justify-center">
                <Recycle size={16} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">旧件回收</p>
                <p className="text-sm font-medium">{stats.recovery} 项</p>
              </div>
            </div>
            {stats.conflicts > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg">
                <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center animate-pulse">
                  <span className="text-sm font-bold text-red-600">!</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">冲突告警</p>
                  <p className="text-sm font-medium text-red-600">{stats.conflicts} 个</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('schedule')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                viewMode === 'schedule'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              )}
            >
              <LayoutGrid size={16} />
              排程视图
            </button>
            <button
              onClick={() => setViewMode('trail')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                viewMode === 'trail'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              )}
            >
              <Activity size={16} />
              调整痕迹
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            {viewMode === 'schedule' ? (
              <>
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="px-4 py-3 border-b bg-gray-50">
                    <h2 className="font-semibold text-gray-700">时间轴排程</h2>
                    <p className="text-xs text-gray-500 mt-1">拖拽任务卡片可调整时间，系统将实时检测冲突</p>
                  </div>
                  <div className="overflow-x-auto">
                    {workPoints.map(workPoint => (
                      <Timeline key={workPoint.id} workPoint={workPoint} />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mt-6">
                  <WorkpointMap />
                  <ConflictAlert />
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <ChangeTrailView />
              </div>
            )}
          </div>
        </div>

        <div className="w-80 border-l bg-gray-50 p-4 overflow-y-auto">
          <ScheduleDetail />
        </div>
      </div>

      {selectedSchedule && (
        <VersionHistory
          scheduleId={selectedSchedule.id}
          onClose={() => useScheduleStore.getState().selectSchedule(null)}
        />
      )}
    </div>
  );
};
