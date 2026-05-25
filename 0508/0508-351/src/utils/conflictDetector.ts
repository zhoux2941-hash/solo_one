import { Schedule, Conflict } from '../types';

export function checkTimeOverlap(s1: Schedule, s2: Schedule): boolean {
  const start1 = new Date(s1.startTime).getTime();
  const end1 = new Date(s1.endTime).getTime();
  const start2 = new Date(s2.startTime).getTime();
  const end2 = new Date(s2.endTime).getTime();
  
  return start1 < end2 && start2 < end1;
}

export function detectConflicts(schedules: Schedule[]): Conflict[] {
  const conflicts: Conflict[] = [];
  
  for (let i = 0; i < schedules.length; i++) {
    for (let j = i + 1; j < schedules.length; j++) {
      const s1 = schedules[i];
      const s2 = schedules[j];
      
      if (s1.status === 'cancelled' || s2.status === 'cancelled') {
        continue;
      }
      
      if (checkTimeOverlap(s1, s2)) {
        if (s1.workpointId === s2.workpointId) {
          if (s1.type === 'sensor-replace' && s2.type !== 'power-off' && s2.type !== 'team-entry') {
            conflicts.push({
              id: `conflict-${s1.id}-${s2.id}`,
              scheduleId1: s1.id,
              scheduleId2: s2.id,
              type: 'safety-violation',
              description: `传感器更换作业"${s1.title}"未在断电窗口内进行`,
              severity: 'critical'
            });
          } else if (s2.type === 'sensor-replace' && s1.type !== 'power-off' && s1.type !== 'team-entry') {
            conflicts.push({
              id: `conflict-${s1.id}-${s2.id}`,
              scheduleId1: s1.id,
              scheduleId2: s2.id,
              type: 'safety-violation',
              description: `传感器更换作业"${s2.title}"未在断电窗口内进行`,
              severity: 'critical'
            });
          } else if (s1.type === 'power-off' || s2.type === 'power-off') {
            continue;
          } else {
            conflicts.push({
              id: `conflict-${s1.id}-${s2.id}`,
              scheduleId1: s1.id,
              scheduleId2: s2.id,
              type: 'time-overlap',
              description: `同一工点"${s1.title}"与"${s2.title}"时间重叠`,
              severity: 'warning'
            });
          }
        }
        
        if (s1.teamId && s2.teamId && s1.teamId === s2.teamId) {
          const existingConflict = conflicts.find(
            c => (c.scheduleId1 === s1.id && c.scheduleId2 === s2.id) ||
                 (c.scheduleId1 === s2.id && c.scheduleId2 === s1.id)
          );
          
          if (!existingConflict || existingConflict.type !== 'resource-conflict') {
            conflicts.push({
              id: `conflict-resource-${s1.id}-${s2.id}`,
              scheduleId1: s1.id,
              scheduleId2: s2.id,
              type: 'resource-conflict',
              description: `班组资源冲突：同一班组同时分配到"${s1.title}"和"${s2.title}"`,
              severity: 'warning'
            });
          }
        }
      }
    }
  }
  
  return conflicts;
}

export function isScheduleInConflict(scheduleId: string, conflicts: Conflict[]): boolean {
  return conflicts.some(
    c => c.scheduleId1 === scheduleId || c.scheduleId2 === scheduleId
  );
}

export function getConflictsForSchedule(scheduleId: string, conflicts: Conflict[]): Conflict[] {
  return conflicts.filter(
    c => c.scheduleId1 === scheduleId || c.scheduleId2 === scheduleId
  );
}
