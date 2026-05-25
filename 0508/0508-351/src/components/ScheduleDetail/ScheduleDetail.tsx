import React, { useState } from 'react';
import { useScheduleStore } from '../../store/useScheduleStore';
import { ScheduleType, ScheduleStatus } from '../../types';
import { format } from 'date-fns';
import { X, Clock, MapPin, Users, FileText, Save, Trash2, Zap, Wrench, Recycle } from 'lucide-react';
import { cn } from '../../lib/utils';

const typeLabels: Record<ScheduleType, string> = {
  'power-off': '断电窗口',
  'sensor-replace': '传感器更换',
  'team-entry': '班组进场',
  'recovery': '旧件回收'
};

const statusLabels: Record<ScheduleStatus, { label: string; color: string }> = {
  pending: { label: '待执行', color: 'bg-gray-100 text-gray-700' },
  'in-progress': { label: '进行中', color: 'bg-green-100 text-green-700' },
  completed: { label: '已完成', color: 'bg-blue-100 text-blue-700' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-700' }
};

export const ScheduleDetail: React.FC = () => {
  const { selectedSchedule, selectSchedule, workPoints, teams, updateSchedule, deleteSchedule } = useScheduleStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(selectedSchedule);

  React.useEffect(() => {
    setEditData(selectedSchedule);
  }, [selectedSchedule]);

  if (!selectedSchedule) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <FileText size={48} className="mb-2" />
          <p className="text-sm">选择一个任务查看详情</p>
        </div>
      </div>
    );
  }

  const workPoint = workPoints.find(wp => wp.id === selectedSchedule.workpointId);
  const team = teams.find(t => t.id === selectedSchedule.teamId);

  const handleSave = () => {
    if (editData) {
      updateSchedule(selectedSchedule.id, editData);
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (confirm('确定要删除此任务吗？')) {
      deleteSchedule(selectedSchedule.id);
      selectSchedule(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="text-lg font-semibold">任务详情</h3>
        <button
          onClick={() => selectSchedule(null)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X size={18} className="text-gray-500" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div>
          {isEditing ? (
          <input
            type="text"
            value={editData?.title || ''}
            onChange={(e) => setEditData({ ...editData!, title: e.target.value })}
            className="w-full text-lg font-semibold border-b border-blue-400 focus:outline-none"
          />
        ) : (
          <h4 className="text-lg font-semibold">{selectedSchedule.title}</h4>
        )}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
              {typeLabels[selectedSchedule.type]}
            </span>
            <span className={cn('text-xs px-2 py-0.5 rounded', statusLabels[selectedSchedule.status].color)}>
              {statusLabels[selectedSchedule.status].label}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <MapPin size={16} className="text-gray-400" />
            <span className="text-gray-500">工点：</span>
            <span className="font-medium">{workPoint?.name} ({workPoint?.line})</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock size={16} className="text-gray-400" />
            <span className="text-gray-500">时间：</span>
            {isEditing ? (
              <div className="flex items-center gap-1">
                <input
                  type="time"
                  value={format(new Date(editData?.startTime || ''), 'HH:mm')}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':');
                    const newStart = new Date(editData!.startTime);
                    newStart.setHours(parseInt(hours), parseInt(minutes));
                    setEditData({ ...editData!, startTime: newStart });
                  }}
                  className="border rounded px-1 text-sm"
                />
                <span>-</span>
                <input
                  type="time"
                  value={format(new Date(editData?.endTime || ''), 'HH:mm')}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':');
                    const newEnd = new Date(editData!.endTime);
                    newEnd.setHours(parseInt(hours), parseInt(minutes));
                    setEditData({ ...editData!, endTime: newEnd });
                  }}
                  className="border rounded px-1 text-sm"
                />
              </div>
            ) : (
              <span className="font-medium">
                {format(new Date(selectedSchedule.startTime), 'HH:mm')} - {format(new Date(selectedSchedule.endTime), 'HH:mm')}
              </span>
            )}
          </div>

          {team && (
            <div className="flex items-center gap-2 text-sm">
              <Users size={16} className="text-gray-400" />
              <span className="text-gray-500">班组：</span>
              <span className="font-medium">{team.name}（{team.leader}）</span>
            </div>
          )}

          {selectedSchedule.description && (
            <div className="text-sm">
              <span className="text-gray-500">描述：</span>
              <p className="mt-1 text-gray-700">{selectedSchedule.description}</p>
            </div>
          )}
        </div>

        <div className="pt-4 border-t flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Save size={14} />
                保存
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 px-3 py-2 border rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                取消
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 px-3 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
              >
                编辑
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center justify-center gap-1 px-3 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors text-sm"
              >
                <Trash2 size={14} />
                删除
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
