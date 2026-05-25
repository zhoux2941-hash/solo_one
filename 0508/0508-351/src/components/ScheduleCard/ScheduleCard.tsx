import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Schedule, ScheduleType } from '../../types';
import { useScheduleStore } from '../../store/useScheduleStore';
import { isScheduleInConflict } from '../../utils/conflictDetector';
import { Clock, AlertTriangle, Zap, Wrench, Users, Recycle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

const typeConfig: Record<ScheduleType, { color: string; bgColor: string; icon: React.ReactNode; label: string }> = {
  'power-off': { color: 'text-amber-700', bgColor: 'bg-amber-100 border-amber-400', icon: <Zap size={14} />, label: '断电窗口' },
  'sensor-replace': { color: 'text-blue-700', bgColor: 'bg-blue-100 border-blue-400', icon: <Wrench size={14} />, label: '传感器更换' },
  'team-entry': { color: 'text-green-700', bgColor: 'bg-green-100 border-green-400', icon: <Users size={14} />, label: '班组进场' },
  'recovery': { color: 'text-purple-700', bgColor: 'bg-purple-100 border-purple-400', icon: <Recycle size={14} />, label: '旧件回收' }
};

interface ScheduleCardProps {
  schedule: Schedule;
  pixelPerHour: number;
  dayStart: Date;
}

export const ScheduleCard: React.FC<ScheduleCardProps> = ({ schedule, pixelPerHour, dayStart }) => {
  const { conflicts, selectSchedule, selectedSchedule } = useScheduleStore();
  const hasConflict = isScheduleInConflict(schedule.id, conflicts);
  const config = typeConfig[schedule.type];
  const isSelected = selectedSchedule?.id === schedule.id;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: schedule.id,
    data: { schedule }
  });

  const startHours = (new Date(schedule.startTime).getTime() - dayStart.getTime()) / (1000 * 60 * 60);
  const durationHours = (new Date(schedule.endTime).getTime() - new Date(schedule.startTime).getTime()) / (1000 * 60 * 60);
  
  const left = startHours * pixelPerHour;
  const width = Math.max(durationHours * pixelPerHour, 60);

  const style = {
    transform: CSS.Translate.toString(transform),
    left: `${left}px`,
    width: `${width}px`,
    zIndex: isDragging ? 100 : isSelected ? 50 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'absolute top-1 bottom-1 rounded-md border-2 cursor-grab active:cursor-grabbing',
        'transition-all duration-150 flex flex-col overflow-hidden',
        config.bgColor,
        hasConflict && 'ring-2 ring-red-500 ring-offset-1 animate-pulse',
        isSelected && 'ring-2 ring-blue-600 ring-offset-1',
        isDragging && 'opacity-80 shadow-lg scale-105'
      )}
      onClick={(e) => {
        e.stopPropagation();
        selectSchedule(schedule);
      }}
    >
      <div className={cn('px-2 py-1 flex items-center gap-1 text-xs font-medium', config.color)}>
        {config.icon}
        <span className="truncate flex-1">{schedule.title}</span>
        {hasConflict && <AlertTriangle size={12} className="text-red-500 flex-shrink-0" />}
      </div>
      <div className="px-2 flex items-center gap-1 text-xs text-gray-600 flex-1">
        <Clock size={10} />
        <span>
          {format(new Date(schedule.startTime), 'HH:mm')} - {format(new Date(schedule.endTime), 'HH:mm')}
        </span>
      </div>
      {schedule.status === 'in-progress' && (
        <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full m-1 animate-pulse" />
      )}
    </div>
  );
};
