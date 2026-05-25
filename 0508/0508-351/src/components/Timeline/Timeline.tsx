import React, { useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { Schedule, WorkPoint } from '../../types';
import { useScheduleStore } from '../../store/useScheduleStore';
import { ScheduleCard } from '../ScheduleCard/ScheduleCard';
import { format } from 'date-fns';

interface TimelineProps {
  workPoint: WorkPoint;
}

export const Timeline: React.FC<TimelineProps> = ({ workPoint }) => {
  const { schedules, updateSchedule, setDragScheduleId, dragScheduleId } = useScheduleStore();
  const [activeSchedule, setActiveSchedule] = useState<Schedule | null>(null);

  const today = new Date();
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const pixelPerHour = 80;
  const totalHours = 24;
  const totalWidth = totalHours * pixelPerHour;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const workPointSchedules = useMemo(() => 
    schedules.filter(s => s.workpointId === workPoint.id),
    [schedules, workPoint.id]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const schedule = event.active.data.current?.schedule as Schedule;
    setActiveSchedule(schedule);
    setDragScheduleId(schedule.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const schedule = active.data.current?.schedule as Schedule;

    if (schedule && delta.x !== 0) {
      const hourDelta = delta.x / pixelPerHour;
      const currentStart = new Date(schedule.startTime);
      const currentEnd = new Date(schedule.endTime);
      const duration = currentEnd.getTime() - currentStart.getTime();

      const newStart = new Date(currentStart.getTime() + hourDelta * 60 * 60 * 1000);
      const newEnd = new Date(newStart.getTime() + duration);

      updateSchedule(schedule.id, {
        startTime: newStart,
        endTime: newEnd
      });
    }

    setActiveSchedule(null);
    setDragScheduleId(null);
  };

  const timeMarkers = useMemo(() => {
    const markers = [];
    for (let i = 0; i <= totalHours; i++) {
      markers.push(i);
    }
    return markers;
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex border-b border-gray-200">
        <div className="w-32 min-w-32 p-2 border-r border-gray-200 bg-gray-50 flex items-center">
          <span className="text-sm font-medium text-gray-700 truncate">{workPoint.name}</span>
          <span className="text-xs text-gray-500 ml-1">({workPoint.line})</span>
        </div>
        
        <div className="relative flex-1 overflow-x-auto">
          <div 
            className="relative h-16 min-w-full"
            style={{ width: `${totalWidth}px` }}
          >
            {timeMarkers.map(hour => (
              <div
                key={hour}
                className="absolute top-0 bottom-0 border-l border-gray-100"
                style={{ left: `${hour * pixelPerHour}px` }}
              >
                <span className="absolute -top-4 left-1 text-xs text-gray-400">
                  {format(new Date(dayStart.getTime() + hour * 60 * 60 * 1000), 'HH:mm')}
                </span>
              </div>
            ))}

            {workPointSchedules.map(schedule => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                pixelPerHour={pixelPerHour}
                dayStart={dayStart}
              />
            ))}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeSchedule ? (
          <div className="opacity-80 shadow-xl rounded-lg p-2 bg-white border-2 border-blue-400">
            <p className="text-sm font-medium">{activeSchedule.title}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
