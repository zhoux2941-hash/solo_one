import React, { useState } from 'react';
import { ClipboardList, Plus, Clock, User, CheckCircle, Circle, ChevronRight, FileText } from 'lucide-react';
import { useScheduleStore } from '../store/useScheduleStore';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { HandoverTask } from '../types';

export const Handover: React.FC = () => {
  const { handovers, teams, addHandover, schedules, workPoints } = useScheduleStore();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedHandover, setSelectedHandover] = useState<string | null>(null);

  const getTeamName = (teamId: string) => {
    return teams.find(t => t.id === teamId)?.name || '未知班组';
  };

  const handleCreate = () => {
    const pendingTasks = schedules
      .filter(s => s.status === 'pending')
      .sort((a, b) => {
        const wpA = workPoints.find(wp => wp.id === a.workpointId);
        const wpB = workPoints.find(wp => wp.id === b.workpointId);
        if (wpA && wpB) {
          if (wpA.line !== wpB.line) {
            return wpA.line.localeCompare(wpB.line);
          }
          return wpA.position - wpB.position;
        }
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      })
      .slice(0, 3)
      .map(s => ({
        id: `task-${s.id}`,
        title: s.title,
        status: 'pending' as const,
        priority: 'medium' as const
      }));

    const newHandover = {
      id: `h${Date.now()}`,
      shiftDate: new Date(),
      fromTeam: 't1',
      toTeam: 't2',
      content: '请完成以下交接任务',
      tasks: pendingTasks,
      status: 'draft' as const,
      createdAt: new Date()
    };
    addHandover(newHandover);
    setShowCreate(false);
  };

  const toggleTask = (handoverId: string, taskId: string) => {
    const handover = handovers.find(h => h.id === handoverId);
    if (handover) {
      const updatedTasks = handover.tasks.map(t =>
        t.id === taskId ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } as HandoverTask : t
      );
      useScheduleStore.getState().updateHandover(handoverId, { tasks: updatedTasks });
    }
  };

  const statusConfig = {
    draft: { label: '草稿', color: 'bg-gray-100 text-gray-600' },
    submitted: { label: '已提交', color: 'bg-blue-100 text-blue-600' },
    confirmed: { label: '已确认', color: 'bg-green-100 text-green-600' }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClipboardList className="text-blue-600" size={24} />
            <div>
              <h1 className="text-xl font-bold text-gray-800">班次交接</h1>
              <p className="text-sm text-gray-500">交接班记录和任务移交</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            新建交接单
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-96 border-r bg-white overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-3">交接单列表</h3>
            <div className="space-y-2">
              {handovers.map(handover => (
                <button
                  key={handover.id}
                  onClick={() => setSelectedHandover(handover.id)}
                  className={cn(
                    'w-full text-left p-4 rounded-lg border transition-all',
                    selectedHandover === handover.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn('text-xs px-2 py-0.5 rounded', statusConfig[handover.status].color)}>
                      {statusConfig[handover.status].label}
                    </span>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User size={14} />
                    <span>{getTeamName(handover.fromTeam)} → {getTeamName(handover.toTeam)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                    <Clock size={12} />
                    <span>{format(handover.createdAt, 'MM-dd HH:mm')}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          {selectedHandover ? (
            <div className="bg-white rounded-lg shadow-sm border max-w-3xl mx-auto">
              {(() => {
                const handover = handovers.find(h => h.id === selectedHandover);
                if (!handover) return null;

                const completedCount = handover.tasks.filter(t => t.status === 'completed').length;
                const progress = handover.tasks.length > 0 ? (completedCount / handover.tasks.length) * 100 : 0;

                return (
                  <>
                    <div className="p-6 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                            <FileText className="text-blue-600" size={24} />
                          </div>
                          <div>
                            <h2 className="text-lg font-semibold">班次交接单</h2>
                            <p className="text-sm text-gray-500">{format(handover.shiftDate, 'yyyy年MM月dd日')}</p>
                          </div>
                        </div>
                        <span className={cn('px-3 py-1 rounded-full text-sm font-medium', statusConfig[handover.status].color)}>
                          {statusConfig[handover.status].label}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">交班班组</p>
                          <p className="font-medium text-gray-800">{getTeamName(handover.fromTeam)}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">接班班组</p>
                          <p className="font-medium text-gray-800">{getTeamName(handover.toTeam)}</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium text-gray-800 mb-2">交接内容</h3>
                        <p className="text-gray-600 p-4 bg-gray-50 rounded-lg">{handover.content}</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium text-gray-800">交接任务</h3>
                          <span className="text-sm text-gray-500">{completedCount}/{handover.tasks.length} 已完成</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="space-y-2">
                          {handover.tasks.map(task => (
                            <button
                              key={task.id}
                              onClick={() => toggleTask(handover.id, task.id)}
                              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                            >
                              {task.status === 'completed' ? (
                                <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                              ) : (
                                <Circle size={20} className="text-gray-300 flex-shrink-0" />
                              )}
                              <span className={cn(
                                'flex-1',
                                task.status === 'completed' && 'line-through text-gray-400'
                              )}>
                                {task.title}
                              </span>
                              <span className={cn(
                                'text-xs px-2 py-0.5 rounded',
                                task.priority === 'high' ? 'bg-red-100 text-red-600' :
                                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                'bg-gray-100 text-gray-600'
                              )}>
                                {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                      <button className="px-4 py-2 border rounded-lg hover:bg-white transition-colors">
                        打印
                      </button>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        确认交接
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ClipboardList size={64} className="mb-4" />
              <p className="text-lg">选择一个交接单查看详情</p>
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[500px] shadow-xl">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">新建交接单</h2>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-500">
                将创建一份新的班次交接单，包含当前待完成的任务。
              </p>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
