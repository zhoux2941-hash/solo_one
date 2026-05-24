import { getRecentConflictRecords } from '../data/conflictRecords.js';
import { applications, rooms, escorts } from '../data/store.js';
import { ConflictAnalysis, ScheduleViewData, ScheduleItem } from '../../shared/types.js';

const RADIATION_SOURCES = [
  { id: 'co-60', name: '钴-60', type: 'γ射线源' },
  { id: 'ir-192', name: '铱-192', type: 'γ射线源' },
  { id: 'i-125', name: '碘-125', type: 'γ射线源' },
  { id: 'cs-137', name: '铯-137', type: 'γ射线源' },
];

export function getConflictAnalysis(days: number = 3): ConflictAnalysis {
  const records = getRecentConflictRecords(days);
  
  const roomConflicts = records.filter(r => r.type === 'room').length;
  const escortConflicts = records.filter(r => r.type === 'escort').length;
  const sourceConflicts = records.filter(r => r.type === 'source').length;

  const roomConflictCount: Record<string, { roomId: string; roomName: string; count: number }> = {};
  const escortConflictCount: Record<string, { escortId: string; escortName: string; count: number }> = {};
  const patternCount: Record<string, number> = {};

  for (const record of records) {
    if (record.type === 'room' && record.roomId) {
      if (!roomConflictCount[record.roomId]) {
        roomConflictCount[record.roomId] = {
          roomId: record.roomId,
          roomName: record.roomName || rooms.find(r => r.id === record.roomId)?.name || record.roomId,
          count: 0,
        };
      }
      roomConflictCount[record.roomId].count++;
      
      const patternKey = `机房冲突-${record.roomName}`;
      patternCount[patternKey] = (patternCount[patternKey] || 0) + 1;
    }
    
    if (record.type === 'escort' && record.escortId) {
      if (!escortConflictCount[record.escortId]) {
        escortConflictCount[record.escortId] = {
          escortId: record.escortId,
          escortName: record.escortName || escorts.find(e => e.id === record.escortId)?.name || record.escortId,
          count: 0,
        };
      }
      escortConflictCount[record.escortId].count++;
      
      const patternKey = `人员冲突-${record.escortName}`;
      patternCount[patternKey] = (patternCount[patternKey] || 0) + 1;
    }

    if (!record.resolved) {
      const unresolvedKey = `待处理-${record.type === 'room' ? '机房' : '人员'}`;
      patternCount[unresolvedKey] = (patternCount[unresolvedKey] || 0) + 1;
    }
  }

  const topConflictRooms = Object.values(roomConflictCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topConflictEscorts = Object.values(escortConflictCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const recurringPatterns = Object.entries(patternCount)
    .map(([pattern, count]) => ({ pattern, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    date: new Date().toISOString().split('T')[0],
    totalConflicts: records.length,
    roomConflicts,
    escortConflicts,
    sourceConflicts,
    topConflictRooms,
    topConflictEscorts,
    recurringPatterns,
  };
}

export function getScheduleView(viewType: 'room' | 'escort', dateStr?: string): ScheduleViewData {
  const targetDate = dateStr ? new Date(dateStr) : new Date();
  const targetDateStr = targetDate.toDateString();
  
  const dayApps = applications.filter(app => {
    const appDate = new Date(app.startTime).toDateString();
    return appDate === targetDateStr && app.status !== 'rejected';
  });

  const items: ScheduleItem[] = [];

  if (viewType === 'room') {
    for (const room of rooms) {
      const roomApps = dayApps.filter(a => a.roomId === room.id);
      for (const app of roomApps) {
        const sourceInfo = RADIATION_SOURCES.find(s => s.id === app.sourceType);
        items.push({
          id: `${room.id}-${app.id}`,
          resourceId: room.id,
          resourceName: room.name,
          startTime: app.startTime,
          endTime: app.endTime,
          applicationId: app.id,
          applicantName: app.applicantName,
          sourceType: sourceInfo?.name || app.sourceType,
          status: app.status,
        });
      }
    }
  } else {
    for (const escort of escorts) {
      const escortApps = dayApps.filter(a => a.escorts.includes(escort.id));
      for (const app of escortApps) {
        const sourceInfo = RADIATION_SOURCES.find(s => s.id === app.sourceType);
        items.push({
          id: `${escort.id}-${app.id}`,
          resourceId: escort.id,
          resourceName: `${escort.name} (${escort.role})`,
          startTime: app.startTime,
          endTime: app.endTime,
          applicationId: app.id,
          applicantName: app.applicantName,
          sourceType: sourceInfo?.name || app.sourceType,
          status: app.status,
        });
      }
    }
  }

  return {
    viewType,
    date: targetDate.toISOString().split('T')[0],
    items,
  };
}
