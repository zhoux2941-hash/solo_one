import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Task, TaskConflict, ConflictLevel, TugboatTimeline, BerthTimeline, GroupMode } from '../types';
import { formatTime, getPhaseColor, getPhaseLabel, calculatePosition, calculateWidth } from '../utils/time';

interface UniversalTimelineProps {
  mode: GroupMode;
  tugboatTimelines: TugboatTimeline[];
  berthTimelines: BerthTimeline[];
  conflicts: TaskConflict[];
  affectedTaskIds: string[];
  vessels: Map<string, string>;
  onTaskClick: (task: Task) => void;
  onTaskDrag?: (taskId: string, newStartTime: Date) => void;
  zoomLevel: number;
  selectedItemId: string | null;
  diffTasks?: Set<string>;
  diffType?: 'added' | 'removed' | 'modified';
}

const UniversalTimeline: React.FC<UniversalTimelineProps> = ({
  mode,
  tugboatTimelines,
  berthTimelines,
  conflicts,
  affectedTaskIds,
  vessels,
  onTaskClick,
  onTaskDrag,
  zoomLevel,
  selectedItemId,
  diffTasks = new Set(),
  diffType
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rowContentRef = useRef<HTMLDivElement>(null);
  const [draggingTask, setDraggingTask] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [contentWidth, setContentWidth] = useState(1000);

  const activeTimelines = mode === 'tugboat' ? tugboatTimelines : berthTimelines;
  const filteredTimelines = selectedItemId 
    ? activeTimelines.filter(t => 
        mode === 'tugboat' 
          ? (t as TugboatTimeline).tugboatId === selectedItemId
          : (t as BerthTimeline).berthId === selectedItemId
      )
    : activeTimelines;

  const { startTime, endTime } = getTimeRange(filteredTimelines as any[], zoomLevel, mode);
  const totalMinutes = (endTime.getTime() - startTime.getTime()) / 60000;
  const timeMarks = generateTimeMarks(startTime, endTime);

  const taskConflicts = new Map<string, TaskConflict>();
  conflicts.forEach(c => {
    taskConflicts.set(c.taskId, c);
    taskConflicts.set(c.conflictTaskId, c);
  });

  useEffect(() => {
    const updateWidth = () => {
      if (rowContentRef.current) {
        setContentWidth(rowContentRef.current.offsetWidth - 32);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [filteredTimelines]);

  const handleMouseDown = useCallback((e: React.MouseEvent, task: Task) => {
    if (!onTaskDrag) return;
    e.preventDefault();
    setDraggingTask(task.id);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset(e.clientX - rect.left);
  }, [onTaskDrag]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingTask || !containerRef.current || !onTaskDrag) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const relativeX = e.clientX - containerRect.left - 16 - dragOffset;
    const containerWidth = containerRect.width - 32;

    const minutesPerPixel = totalMinutes / containerWidth;
    const newMinutes = relativeX * minutesPerPixel;
    const newStartTime = new Date(startTime.getTime() + newMinutes * 60000);

    onTaskDrag(draggingTask, newStartTime);
  }, [draggingTask, dragOffset, startTime, totalMinutes, onTaskDrag]);

  const handleMouseUp = useCallback(() => {
    setDraggingTask(null);
  }, []);

  useEffect(() => {
    if (draggingTask) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingTask, handleMouseMove, handleMouseUp]);

  const renderTask = (task: Task) => {
    const left = calculatePosition(task.startTime, startTime, endTime, contentWidth);
    const width = calculateWidth(task.startTime, task.endTime, startTime, endTime, contentWidth);
    
    const conflict = taskConflicts.get(task.id);
    const conflictClass = conflict 
      ? conflict.level === ConflictLevel.ERROR ? 'conflict-error' : 'conflict-warning'
      : '';
    const affectedClass = affectedTaskIds.includes(task.id) ? 'affected' : '';
    
    const isDiff = diffTasks.has(task.id);
    const diffClass = isDiff ? `diff-${diffType || 'modified'}` : '';

    return (
      <div
        key={task.id}
        className={`task-bar ${conflictClass} ${affectedClass} ${diffClass}`}
        style={{
          left: `${left}px`,
          width: `${Math.max(width, 60)}px`,
          backgroundColor: getPhaseColor(task.phase),
          cursor: onTaskDrag ? (draggingTask === task.id ? 'grabbing' : 'grab') : 'pointer',
          opacity: isDiff && diffType === 'removed' ? 0.5 : 1
        }}
        onClick={(e) => {
          if (!draggingTask) {
            e.stopPropagation();
            onTaskClick(task);
          }
        }}
        onMouseDown={(e) => handleMouseDown(e, task)}
        title={`${getPhaseLabel(task.phase)} - ${vessels.get(task.vesselId) || task.vesselId}`}
      >
        <div className="task-info">
          <div className="task-phase">{getPhaseLabel(task.phase)}</div>
          <div className="task-vessel">{vessels.get(task.vesselId) || task.vesselId}</div>
          <div className="task-time">
            {formatTime(task.startTime)} - {formatTime(task.endTime)}
          </div>
        </div>
        {isDiff && (
          <div style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: diffType === 'added' ? '#10B981' : diffType === 'removed' ? '#EF4444' : '#F59E0B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 'bold',
            color: 'white'
          }}>
            {diffType === 'added' ? '+' : diffType === 'removed' ? '−' : '~'}
          </div>
        )}
      </div>
    );
  };

  const getItemName = (item: TugboatTimeline | BerthTimeline) => {
    return mode === 'tugboat' 
      ? (item as TugboatTimeline).tugboatName 
      : (item as BerthTimeline).berthName;
  };

  const getItemSub = (item: TugboatTimeline | BerthTimeline) => {
    if (mode === 'tugboat') {
      return `${item.tasks.length} 个任务`;
    }
    return `${(item as BerthTimeline).berthCode} · ${item.tasks.length} 个任务`;
  };

  return (
    <div className="timeline-container" ref={containerRef}>
      <div className="timeline-header">
        <div className="timeline-label">{mode === 'tugboat' ? '拖轮' : '泊位'}</div>
        <div className="timeline-scale">
          <div className="time-marks">
            {timeMarks.map((mark, i) => (
              <div key={i} className="time-mark">{mark}</div>
            ))}
          </div>
        </div>
      </div>
      <div className="timeline-scroll">
        {filteredTimelines.map((timeline) => (
          <div key={mode === 'tugboat' ? (timeline as TugboatTimeline).tugboatId : (timeline as BerthTimeline).berthId} className="timeline-row">
            <div className="timeline-row-label">
              <div className="name">{getItemName(timeline)}</div>
              <div className="sub">{getItemSub(timeline)}</div>
            </div>
            <div className="timeline-row-content" ref={rowContentRef}>
              <div className="grid-lines">
                {timeMarks.map((_, i) => (
                  <div 
                    key={i} 
                    className="grid-line" 
                    style={{ left: `${(i / (timeMarks.length - 1)) * 100}%` }} 
                  />
                ))}
              </div>
              {timeline.tasks
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .map(task => renderTask(task))}
            </div>
          </div>
        ))}
        {filteredTimelines.length === 0 && (
          <div className="empty-state">暂无数据</div>
        )}
      </div>
    </div>
  );
};

function getTimeRange(
  timelines: (TugboatTimeline | BerthTimeline)[], 
  zoomLevel: number,
  mode: GroupMode
) {
  const allTimes = timelines.flatMap(t => 
    t.tasks.flatMap(task => [new Date(task.startTime), new Date(task.endTime)])
  );

  if (allTimes.length === 0) {
    const now = new Date();
    return {
      startTime: new Date(now.getTime() - 30 * 60000),
      endTime: new Date(now.getTime() + 120 * 60000)
    };
  }

  const minTime = new Date(Math.min(...allTimes.map(d => d.getTime())));
  const maxTime = new Date(Math.max(...allTimes.map(d => d.getTime())));

  const padding = (1.1 - zoomLevel * 0.1) * 60 * 60000;
  return {
    startTime: new Date(minTime.getTime() - padding),
    endTime: new Date(maxTime.getTime() + padding)
  };
}

function generateTimeMarks(start: Date, end: Date): string[] {
  const marks: string[] = [];
  const step = Math.ceil((end.getTime() - start.getTime()) / 60000 / 6);
  const current = new Date(start);

  while (current <= end) {
    marks.push(formatTime(current));
    current.setMinutes(current.getMinutes() + step);
  }

  return marks;
}

export default UniversalTimeline;
