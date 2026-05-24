import { ConflictRollbackRecord } from '../../shared/types.js';
import { rooms, escorts } from './store.js';

function getRoomName(roomId: string): string {
  return rooms.find(r => r.id === roomId)?.name || roomId;
}

function getEscortName(escortId: string): string {
  return escorts.find(e => e.id === escortId)?.name || escortId;
}

function getRecentDate(daysAgo: number, hour: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

export let conflictRecords: ConflictRollbackRecord[] = [
  {
    id: 'rec-1',
    applicationId: 'app-2',
    applicantName: '王医生',
    type: 'room',
    roomId: 'room-2',
    roomName: getRoomName('room-2'),
    startTime: getRecentDate(0, 10),
    endTime: getRecentDate(0, 11),
    detectedAt: getRecentDate(0, 8),
    resolved: false,
  },
  {
    id: 'rec-2',
    applicationId: 'app-2',
    applicantName: '王医生',
    type: 'escort',
    escortId: 'escort-2',
    escortName: getEscortName('escort-2'),
    startTime: getRecentDate(0, 10),
    endTime: getRecentDate(0, 11),
    detectedAt: getRecentDate(0, 8),
    resolved: true,
    resolvedAt: getRecentDate(0, 8),
    resolution: '更换陪同人员为李娜',
  },
  {
    id: 'rec-3',
    applicationId: 'app-4',
    applicantName: '陈医生',
    type: 'room',
    roomId: 'room-1',
    roomName: getRoomName('room-1'),
    startTime: getRecentDate(1, 9),
    endTime: getRecentDate(1, 11),
    detectedAt: getRecentDate(1, 10),
    resolved: false,
  },
  {
    id: 'rec-4',
    applicationId: 'app-x1',
    applicantName: '赵医生',
    type: 'escort',
    escortId: 'escort-1',
    escortName: getEscortName('escort-1'),
    startTime: getRecentDate(1, 14),
    endTime: getRecentDate(1, 16),
    detectedAt: getRecentDate(1, 13),
    resolved: true,
    resolvedAt: getRecentDate(1, 13),
    resolution: '调整时段到16:00',
  },
  {
    id: 'rec-5',
    applicationId: 'app-x2',
    applicantName: '孙医生',
    type: 'room',
    roomId: 'room-1',
    roomName: getRoomName('room-1'),
    startTime: getRecentDate(2, 9),
    endTime: getRecentDate(2, 10),
    detectedAt: getRecentDate(2, 8),
    resolved: true,
    resolvedAt: getRecentDate(2, 8),
    resolution: '更换机房到room-2',
  },
  {
    id: 'rec-6',
    applicationId: 'app-x3',
    applicantName: '周医生',
    type: 'escort',
    escortId: 'escort-3',
    escortName: getEscortName('escort-3'),
    startTime: getRecentDate(2, 15),
    endTime: getRecentDate(2, 17),
    detectedAt: getRecentDate(2, 14),
    resolved: false,
  },
  {
    id: 'rec-7',
    applicationId: 'app-x4',
    applicantName: '吴医生',
    type: 'room',
    roomId: 'room-2',
    roomName: getRoomName('room-2'),
    startTime: getRecentDate(2, 11),
    endTime: getRecentDate(2, 12),
    detectedAt: getRecentDate(2, 10),
    resolved: true,
    resolvedAt: getRecentDate(2, 10),
    resolution: '延后半小时',
  },
  {
    id: 'rec-8',
    applicationId: 'app-x5',
    applicantName: '郑医生',
    type: 'escort',
    escortId: 'escort-5',
    escortName: getEscortName('escort-5'),
    startTime: getRecentDate(2, 9),
    endTime: getRecentDate(2, 10),
    detectedAt: getRecentDate(2, 8),
    resolved: true,
    resolvedAt: getRecentDate(2, 8),
    resolution: '陈明换班',
  },
];

export function addConflictRecord(record: Omit<ConflictRollbackRecord, 'id' | 'detectedAt' | 'resolved'>): ConflictRollbackRecord {
  const newRecord: ConflictRollbackRecord = {
    ...record,
    id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    detectedAt: new Date().toISOString(),
    resolved: false,
  };
  conflictRecords.push(newRecord);
  return newRecord;
}

export function resolveConflictRecord(id: string, resolution: string): ConflictRollbackRecord | null {
  const index = conflictRecords.findIndex(r => r.id === id);
  if (index === -1) return null;
  conflictRecords[index] = {
    ...conflictRecords[index],
    resolved: true,
    resolvedAt: new Date().toISOString(),
    resolution,
  };
  return conflictRecords[index];
}

export function getRecentConflictRecords(days: number = 3): ConflictRollbackRecord[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  
  return conflictRecords
    .filter(r => new Date(r.detectedAt) >= cutoff)
    .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
}
