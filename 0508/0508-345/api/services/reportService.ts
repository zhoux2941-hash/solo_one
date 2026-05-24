import { applications, rooms } from '../data/store.js';
import { DailyReport } from '../../shared/types.js';
import { isTimeOverlap } from './conflictService.js';

function countDayConflicts(targetDateStr: string): number {
  const dayApps = applications.filter(app => {
    const appDate = new Date(app.startTime).toDateString();
    return appDate === targetDateStr && app.status !== 'rejected';
  });

  let conflictPairs = 0;
  const countedPairs = new Set<string>();

  for (let i = 0; i < dayApps.length; i++) {
    for (let j = i + 1; j < dayApps.length; j++) {
      const app1 = dayApps[i];
      const app2 = dayApps[j];
      
      const pairKey = [app1.id, app2.id].sort().join('-');
      if (countedPairs.has(pairKey)) continue;

      const hasRoomConflict = app1.roomId === app2.roomId;
      const hasTimeOverlap = isTimeOverlap(app1.startTime, app1.endTime, app2.startTime, app2.endTime);
      const hasEscortOverlap = app1.escorts.some(e => app2.escorts.includes(e));

      if (hasTimeOverlap && (hasRoomConflict || hasEscortOverlap)) {
        conflictPairs++;
        countedPairs.add(pairKey);
      }
    }
  }

  return conflictPairs;
}

export function getDailyReport(dateStr?: string): DailyReport {
  const targetDate = dateStr ? new Date(dateStr) : new Date();
  const targetDateStr = targetDate.toDateString();

  const dayApps = applications.filter(app => {
    const appDate = new Date(app.startTime).toDateString();
    return appDate === targetDateStr;
  });

  const totalApplications = dayApps.length;
  const approvedCount = dayApps.filter(a => a.status === 'approved').length;
  const rejectedCount = dayApps.filter(a => a.status === 'rejected').length;
  const pendingCount = dayApps.filter(a => a.status === 'pending').length;

  const roomUtilization = rooms
    .filter(r => r.status === 'available')
    .map(room => {
      const roomApps = dayApps.filter(a => a.roomId === room.id && a.status !== 'rejected');
      let totalMinutes = 0;
      for (const app of roomApps) {
        const start = new Date(app.startTime).getTime();
        const end = new Date(app.endTime).getTime();
        totalMinutes += (end - start) / 60000;
      }
      const utilization = Math.min(100, Math.round((totalMinutes / (8 * 60)) * 100));
      return { roomId: room.id, roomName: room.name, utilization };
    });

  const conflictCount = countDayConflicts(targetDateStr);

  return {
    date: targetDate.toISOString().split('T')[0],
    totalApplications,
    approvedCount,
    rejectedCount,
    pendingCount,
    roomUtilization,
    conflictCount,
  };
}
